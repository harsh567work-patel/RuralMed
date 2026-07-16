# Setup Guide: Offline-First RuralMed

## Prerequisites

- Node.js 16+ installed
- npm or yarn
- Backend server running on `http://localhost:5000`

## Installation Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `dexie` - Local IndexedDB wrapper
- `vite-plugin-pwa` - PWA/Service Worker support

### 2. Environment Variables

Create `.env.local` (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

Default is `http://localhost:5000/api` (no env file needed for local dev)

### 3. Build & Run

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## First Run Checklist

- [ ] Backend `npm start` running on port 5000
- [ ] Frontend `npm run dev` running on Vite port
- [ ] Browser console shows no errors
- [ ] Can create a patient
- [ ] Offline mode works (DevTools → Network → Offline)
- [ ] Data persists offline
- [ ] Auto-sync works when back online

## Documentation Files

### For Developers

1. **OFFLINE_FIRST_ARCHITECTURE.md** (this repo)
   - Design overview
   - Data flow diagrams
   - Performance considerations
   - Debugging tips

2. **OFFLINE_FIRST_INTEGRATION_GUIDE.js** (this repo)
   - Code examples
   - Complete usage patterns
   - Copy-paste ready code

3. **Inline Code Comments**
   - Check `/src/services/patientService.js`
   - Check `/src/services/syncService.js`
   - Check `/src/hooks/useNetworkStatus.js`

### API Implementation Guide

Your backend needs to support sync operations:

#### Update Patient Route

```javascript
// backend/routes/patients.js
router.post('/patients/batch-sync', authMiddleware, async (req, res) => {
  const { records } = req.body;
  
  for (const record of records) {
    const { uuid, operation, data } = record;
    
    if (operation === 'create') {
      // Create with uuid as id
      await createPatient(uuid, data);
    } else if (operation === 'update') {
      // Update existing
      await updatePatient(uuid, data);
    } else if (operation === 'delete') {
      // Soft delete
      await softDeletePatient(uuid);
    }
  }
  
  res.json({ synced: records.length });
});
```

## Key Files to Understand

### Database Layer

**`/src/db/dexie.js`**
- Dexie schema definition
- Database initialization
- Utility functions (export, clear)
- **Must-read for understanding data structure**

### Service Layer

**`/src/services/patientService.js`**
- Offline-first CRUD operations
- Search & filtering
- Sync status management
- **Use this, don't call API directly**

**`/src/services/syncService.js`**
- Background sync logic
- Conflict resolution
- Retry mechanism
- Sync event emitting
- **Core sync engine**

**`/src/services/api.js`** (Enhanced)
- Backend communication
- Timeout handling
- Safe sync wrappers
- **Only called by syncService**

### Hooks Layer

**`/src/hooks/useNetworkStatus.js`**
- Online/offline detection
- Auto-sync on restore
- Network context provider
- **Setup in App wrapper**

**`/src/hooks/useSyncStatus.js`**
- Real-time sync progress
- Unsynced counts
- Last sync details
- **Use in UI components**

### Components

**`/src/components/SyncUI.jsx`**
- Status bar (top of page)
- Sync progress indicator
- Offline notification
- Error alerts
- **Ready to drop into App**

### Utilities

**`/src/utils/pwa.js`**
- Service worker registration
- Update detection
- Install prompt handling
- **Auto-initialized in main.jsx**

## Architecture Quick Reference

### Data Flow (30-second Summary)

```
Write Data → IndexedDB (instant, synced=false)
           → UI Updates (no wait)
           → Auto-sync in background (when online)
           → Mark synced=true

Read Data  → Always from IndexedDB (instant)
           → No network call needed
```

### Call These Functions

✅ **DO THIS:**
```javascript
// Always local-first
await patientService.createPatient(data);
await patientService.getAllPatients();
await patientService.updatePatient(uuid, newData);
```

❌ **DON'T DO THIS:**
```javascript
// Don't call backend API directly for CRUD
await patients.create(data);
await apiCall('POST', '/patients', data);
```

✅ **Sync happens automatically**, but can trigger manually:
```javascript
import { triggerSync } from './hooks/useNetworkStatus.js';
const { triggerSync } = useNetwork();
<button onClick={triggerSync}>Sync Now</button>
```

## Common Tasks

### Add Unsynced Indicator to Patient List

```jsx
import { useSyncStatus } from '../hooks/useSyncStatus.js';

function PatientItem({ patient }) {
  const { unsyncedStats } = useSyncStatus();
  
  return (
    <div>
      <span>{patient.name}</span>
      {!patient.synced && <span>⏳ Syncing</span>}
    </div>
  );
}
```

### Show Offline Message

```jsx
import { OfflineNotification } from '../components/SyncUI.jsx';

function MyPage() {
  return (
    <div>
      <OfflineNotification />
      {/* Rest of page */}
    </div>
  );
}
```

### Manually Trigger Sync

```jsx
import { useNetwork } from '../hooks/useNetworkStatus.js';

function SyncButton() {
  const { triggerSync, isSyncing } = useNetwork();
  
  return (
    <button onClick={triggerSync} disabled={isSyncing}>
      {isSyncing ? 'Syncing...' : 'Sync'}
    </button>
  );
}
```

### Check Sync Queue

```javascript
import { getSyncQueueStatus } from '../services/syncService.js';

const status = await getSyncQueueStatus();
console.log(`${status.total} items in sync queue`);
```

## Troubleshooting

### IndexedDB Not Working

**Error**: "NotAllowedError: Invalid scope for sync"

**Fix**: 
- Check browser privacy settings
- Try different browser (Chrome/Firefox/Edge)
- Clear site data: DevTools → Application → Clear Storage

### Sync Not Triggering

**Symptom**: Changes marked as synced=false but not syncing

**Check**:
1. Is backend running? `http://localhost:5000`
2. Is network actually online? `navigator.onLine`
3. Check console for errors
4. Try manual `triggerSync()`

### Backend Integration Fails

**Error**: "Cannot reach server at http://localhost:5000"

**Fix**:
1. Verify backend running: `lsof -i :5000`
2. Check CORS headers in backend
3. Verify `/api/patients` endpoint exists
4. Add `uuid` field support to backend schema

## Database Schema (Dexie)

```javascript
db.version(1).stores({
  patients: '++id, &uuid, createdAt, updatedAt, synced',
  prescriptions: '++id, &uuid, patientId, createdAt, updatedAt, synced',
  referrals: '++id, &uuid, patientId, createdAt, updatedAt, synced',
  inventory: '++id, &uuid, createdAt, updatedAt, synced',
  syncQueue: '++id, createdAt, entityType, entityId, operation',
  conflictLog: '++id, createdAt, entityType, entityId',
});
```

### Table Structure

Each table has standard fields:

```javascript
{
  id: number,           // Auto-increment Dexie ID
  uuid: string,         // Client-side unique ID
  synced: boolean,      // Sync status
  syncedAt: timestamp,  // Last sync time
  updatedAt: timestamp, // For conflict resolution
  deletedAt: timestamp, // NULL if active, set if deleted
  
  // Module-specific fields
  // (patients: name, age, village, phone, etc.)
}
```

## Network Events

The app listens to these browser events:

```javascript
window.addEventListener('online', () => {
  // Network restored - auto-sync triggered
});

window.addEventListener('offline', () => {
  // Network lost - app continues offline
});
```

You can also trigger manual sync:

```javascript
await triggerSync();
```

## Performance Tips

### For Large Datasets (1000+ patients)

Use pagination:
```javascript
await patientService.getAllPatients({
  limit: 50,    // Get 50 records
  offset: 0,    // Starting at 0
  onlyUnsynced: false
});
```

### For Frequent Updates

Batch updates before syncing:
```javascript
await patientService.batchUpdatePatients([
  { uuid: 'id1', data: {name: 'New Name'} },
  { uuid: 'id2', data: {age: 45} },
]);
```

### Monitor Queue Size

```javascript
const { itemsInQueue } = useSyncStatus();
// If > 100, consider manual batching
```

## Next Steps

1. **Test offline mode** - DevTools → Network → Offline
2. **Integrate with existing components** - Follow INTEGRATION_GUIDE
3. **Add other modules** - Copy patient pattern for prescriptions
4. **Setup PWA icons** - Add 192x192 and 512x512 PNGs
5. **Test on mobile** - Use Android/iOS for real offline scenarios

## Getting Help

### Debug Queries

```javascript
// Check database state
import { db, exportDatabase } from './db/dexie.js';
const backup = await exportDatabase();
console.table(backup.patients);

// Check sync status
import { getSyncQueueStatus } from './services/syncService.js';
const queue = await getSyncQueueStatus();
console.log('Queue:', queue);

// Check network status
console.log('Online:', navigator.onLine);
```

### Browser DevTools

**Application → Indexed DB → ruralmedDB**
- View all tables
- Inspect records
- Verify synced flag

**Console**
- Look for `[DB]`, `[Sync]`, `[API]` prefixed logs
- Filter by source: `App.jsx`, `patientService.js`

### Backend Verification

```bash
# Check if backend is running
curl http://localhost:5000/api/patients

# Should return patient list (with auth header)
```

---

**Need more help?** Check the inline code comments in each service file.

**Last Updated**: March 17, 2025
