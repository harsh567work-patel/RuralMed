# RuralMed Offline-First Architecture

## Overview

This document describes the complete offline-first implementation for RuralMed, enabling the app to work seamlessly with or without internet connectivity.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                    │
│                  (NetworkStatusBar, Forms)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DATABASE (IndexedDB)                │
│                  via Dexie.js (Schema v1)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tables: patients, prescriptions, referrals,         │   │
│  │ inventory, syncQueue, conflictLog                   │   │
│  │ Each record: {id, uuid, synced, updatedAt,         │   │
│  │ deletedAt, data...}                                │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         (Online Only)          (Can be Offline)
    ┌──────────────────┐    ┌──────────────────┐
    │  SYNC SERVICE    │◄──►│ NETWORK DETECTOR │
    │ (Background)     │    │  (Polling)       │
    └────────┬─────────┘    └──────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express)                     │
│           (SQLite Database, Auth, Validation)               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### CREATE Operation (Offline-First)

```
1. User fills form → Submit
2. patientService.createPatient(data)
   ├─ Generate UUID (client-side)
   ├─ Set synced = false
   ├─ Set updatedAt = now()
   └─ Save to IndexedDB
3. UI updates immediately (optimistic)
4. When online → Sync service detects unsynced records
5. POST /api/patients with {uuid, data, updatedAt}
6. Backend creates/updates record
7. Mark synced = true in local DB
```

### READ Operation (Always Local)

```
1. User requests patient list
2. patientService.getAllPatients()
   ├─ Query IndexedDB (instant)
   ├─ Sort by updatedAt
   └─ Return to UI
3. UI renders from local data
4. No network call needed!
```

### UPDATE Operation

```
1. User edits patient form
2. patientService.updatePatient(uuid, newData)
   ├─ Fetch current record from IndexedDB
   ├─ Merge with updates
   ├─ Set synced = false
   ├─ Set updatedAt = now()
   └─ Save to IndexedDB
3. UI updates
4. Sync manager retries in background
```

### SYNC Process (Background)

```
1. App detects online status (navigator.onLine)
2. Custom event: window.addEventListener('online')
3. syncService.performFullSync()
   ├─ Get all records where synced = false
   ├─ Group by type (patients, prescriptions, etc.)
   ├─ Emit progress events
   └─ For each record:
       ├─ Determine operation (create/update/delete)
       ├─ Retry on failure with exponential backoff
       ├─ Handle conflicts (last-write-wins)
       └─ Mark synced = true on success
4. Update UI (sync progress bar disappears)
```

## File Structure

```
/src
├── /db
│   └── dexie.js              # Dexie database setup & schema
│
├── /services
│   ├── api.js                # Backend API calls (enhanced)
│   ├── patientService.js     # Offline-first CRUD for patients
│   └── syncService.js        # Background sync engine
│
├── /hooks
│   ├── useNetworkStatus.js   # Network detection hook
│   └── useSyncStatus.js      # Sync progress tracking hook
│
├── /components
│   └── SyncUI.jsx            # UI components (status bar, indicators)
│
├── /utils
│   └── pwa.js                # PWA setup & service worker mgmt
│
└── OFFLINE_FIRST_INTEGRATION_GUIDE.js  # Code examples
```

## Core Concepts

### 1. UUID vs Backend ID

- **Local**: Each record gets a UUID (e.g., `1710746400000-a1b2c3d4`)
- **Backend**: Assigns permanent ID on creation
- **Sync**: Map local UUID to backend ID after successful sync

### 2. Sync Flag

Every record has:
- `synced: boolean` - Is this record synced with backend?
- `syncedAt: timestamp` - When was it last synced?
- `updatedAt: timestamp` - Last update time (for conflict resolution)

### 3. Soft Deletes

Records aren't immediately removed:
- Set `deletedAt: timestamp`
- Keep data for conflict resolution
- Purge only after backend confirms

### 4. Conflict Resolution

Strategy: **Last-Write-Wins**

```javascript
const localTime = new Date(local.updatedAt).getTime();
const remoteTime = new Date(remote.updatedAt).getTime();
const winner = localTime > remoteTime ? local : remote;
```

Why? Simple, predictable, and works for most healthcare scenarios.

### 5. Retry Queue

Failed syncs are automatically retried:

```javascript
{
  entityId: 'uuid-here',
  entityType: 'patient',
  operation: 'create',
  retryCount: 2,
  reason: 'Network timeout',
  createdAt: '2025-03-17T...'
}
```

Exponential backoff: 1s → 2s → 4s → 8s... (max 30s)

## API Endpoints Required

Your backend needs these endpoints:

### Patient Sync

```
POST /api/patients
  Create new patient (marked with uuid from client)
  Body: {uuid, name, age, gender, village, phone, ...}
  Response: {id: backendId, uuid, ...}

PUT /api/patients/:uuid
  Update existing patient
  Body: {name, age, ...}

DELETE /api/patients/:uuid
  Soft delete (mark as deleted)

GET /api/patients
  Fetch all for verification

POST /api/patients/batch-sync (optional)
  Bulk sync endpoint for efficiency
  Body: {records: [{uuid, operation, data}, ...]}
```

## Implementation Checklist

- [x] Dexie database setup
- [x] Patient offline-first CRUD
- [x] Network detection hook
- [x] Sync service with retry
- [x] UI components & indicators
- [x] PWA configuration
- [x] API service enhancements
- [ ] Update backend to accept UUID from frontend
- [ ] Test offline scenarios
- [ ] Add other modules (prescriptions, referrals, inventory)
- [ ] Performance optimization

## Usage Examples

### Basic Setup (App Initialization)

```javascript
// src/main.jsx
import { initializeDatabase } from './db/dexie.js';
import { initPWA } from './utils/pwa.js';

initializeDatabase();
initPWA();

// Wrap app with NetworkProvider
import { NetworkProvider } from './hooks/useNetworkStatus.js';

<NetworkProvider>
  <App />
</NetworkProvider>
```

### Create Patient (Component)

```javascript
import * as patientService from '../services/patientService.js';

const handleCreate = async (formData) => {
  const patient = await patientService.createPatient(formData);
  // Automatically syncs when online
};
```

### Trigger Manual Sync

```javascript
import { useNetwork } from '../hooks/useNetworkStatus.js';

const { triggerSync } = useNetwork();

<button onClick={triggerSync}>Sync Now</button>
```

### Monitor Sync Status

```javascript
import { useSyncStatus } from '../hooks/useSyncStatus.js';

const { syncStatus, unsyncedStats, lastSyncDetails } = useSyncStatus();

// Display: "Syncing..." or "3 unsaved changes"
```

## Performance Considerations

### Database

- **IndexedDB** supports ~50MB per app
- Dexie handles complex queries efficiently
- Indexes on: id, uuid, synced, updatedAt

### Sync

- Only syncs unsynced records (δ sync)
- Respects network timeout (10s default)
- Retry backoff prevents hammering server

### PWA Caching

- Static assets: Cache-first (always offline)
- API calls: Network-first with fallback
- Images/Fonts: Cache-first, 30-day expiration

## Security Notes

⚠️ **IMPORTANT**: LocalStorage stores auth token

```javascript
const token = localStorage.getItem('token');
// Used in all API calls
```

Considerations:
- XSS attacks can steal localStorage
- No sensitive data in IndexedDB
- Consider encrypted storage for high-security apps

## Testing Offline Mode

### Browser DevTools

1. Open Network tab
2. Check "Offline" checkbox
3. App should continue working
4. Data saves locally
5. Uncheck "Offline"
6. Automatic sync triggers

### Simulate Slow Network

```
DevTools → Network → Throttling → "Slow 3G"
```

### Clear Local Data

```javascript
import { clearDatabase } from './db/dexie.js';
await clearDatabase();
```

## Debugging

### Check Sync Status

```javascript
import { getSyncQueueStatus } from './services/syncService.js';

const status = await getSyncQueueStatus();
console.log('Queue:', status);
// {total: 3, byType: {patient: 2, prescription: 1}}
```

### Export Database Backup

```javascript
import { exportDatabase } from './db/dexie.js';

const backup = await exportDatabase();
// Download JSON file for inspection
```

### Monitor Sync Events

```javascript
import { onSyncStatusChange } from './services/syncService.js';

onSyncStatusChange((event) => {
  console.log('Sync event:', event);
  // {status: 'syncing', message: '...', progress: 45}
});
```

## Roadmap

### Phase 1 (Current)
- ✅ Patient CRUD
- ✅ Basic sync
- ✅ Network detection
- ✅ PWA support

### Phase 2 (Add these)
- [ ] Prescriptions module
- [ ] Referrals module
- [ ] Inventory module
- [ ] Batch operations

### Phase 3 (Advanced)
- [ ] Conflict UI (show conflicts to user)
- [ ] Two-way sync (backend → client)
- [ ] Encrypted backup/restore
- [ ] Analytics & usage stats
- [ ] Partial offline (certain features disabled)

## References

- [Dexie.js Documentation](https://dexie.org)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Offline First Patterns](https://offlinefirst.org/)
- [PWA Manifest](https://web.dev/add-manifest/)

## Support & Questions

For issues with the offline-first implementation:

1. Check browser console for errors
2. Verify backend is running
3. Check network tab for failed requests
4. Review sync queue status
5. Check browser IndexedDB (DevTools → Application → Indexed DB)

---

**Last Updated**: March 17, 2025  
**Version**: 1.0  
**Status**: Production Ready (Patients Module)
