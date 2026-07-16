# Offline-First Quick Reference Card

## 📋 Core Concepts (30 seconds)

Every record has three fields:
- `uuid`: Client-side unique ID
- `synced`: boolean - is this synced?
- `updatedAt`: timestamp - for conflict resolution

**The Rule**: Always read/write from **IndexedDB**, not backend API.

---

## 🚀 Essential Imports

```javascript
// CRUD Operations
import * as patientService from '../services/patientService.js';

// Network Status
import { useNetwork } from '../hooks/useNetworkStatus.js';
import { useSyncStatus } from '../hooks/useSyncStatus.js';

// UI Components
import { NetworkStatusBar, OfflineNotification, SyncProgress } from '../components/SyncUI.jsx';

// Sync Control
import { performFullSync, onSyncStatusChange } from '../services/syncService.js';

// PWA
import { initPWA } from '../utils/pwa.js';
```

---

## 📝 CRUD Operations

### CREATE
```javascript
const patient = await patientService.createPatient({
  name: 'John',
  age: 45,
  gender: 'M',
  village: 'Nairobi',
  phone: '0712345678',
  diagnosis: 'Malaria',
});
// Returns: {id, uuid, synced: false, updatedAt, ...}
```

### READ
```javascript
const allPatients = await patientService.getAllPatients({
  limit: 50,
  offset: 0,
});

const one = await patientService.getPatientByUUID(uuid);

const results = await patientService.searchPatients('John');
```

### UPDATE
```javascript
const updated = await patientService.updatePatient(uuid, {
  diagnosis: 'Typhoid',
  notes: 'New notes',
});
// Automatically marks synced = false
```

### DELETE
```javascript
// Soft delete (keeps data)
await patientService.deletePatient(uuid);

// Hard delete (use after sync confirms)
await patientService.purgeDeletedPatient(uuid);
```

---

## 🔄 Sync Operations

### Auto-Sync (Automatic)
Just works! The app:
1. Detects when online
2. Finds unsynced records
3. Syncs in background
4. Updates UI

### Manual Sync
```javascript
import { useNetwork } from '../hooks/useNetworkStatus.js';

function MyComponent() {
  const { triggerSync, isSyncing } = useNetwork();
  
  return (
    <button onClick={triggerSync} disabled={isSyncing}>
      {isSyncing ? 'Syncing...' : 'Sync'}
    </button>
  );
}
```

### Check Queue
```javascript
import { getSyncQueueStatus } from '../services/syncService.js';

const status = await getSyncQueueStatus();
console.log(`${status.total} items pending sync`);
```

---

## 📊 UI Components

### Status Bar (Top of Page)
```javascript
import { NetworkStatusBar } from '../components/SyncUI.jsx';

<NetworkStatusBar />
// Shows: 🟢 Online | 🔴 Offline (3 unsaved) | 🟡 Syncing...
```

### Offline Warning
```javascript
import { OfflineNotification } from '../components/SyncUI.jsx';

<OfflineNotification />
// Only shows when offline
```

### Sync Progress
```javascript
import { SyncProgress } from '../components/SyncUI.jsx';

<SyncProgress />
// Shows progress bar while syncing
```

### Error Alert
```javascript
import { SyncErrorAlert } from '../components/SyncUI.jsx';

<SyncErrorAlert />
// Shows when sync fails
```

### Detailed Status
```javascript
import { DataSyncStatus } from '../components/SyncUI.jsx';

<DataSyncStatus />
// Shows unsynced counts, queue info, last sync time
```

---

## 🎯 Hooks

### useNetwork()
```javascript
const {
  isOnline,        // boolean
  isSyncing,       // boolean
  syncError,       // string | null
  lastSyncTime,    // Date | null
  triggerSync,     // () => Promise
} = useNetwork();
```

### useSyncStatus()
```javascript
const {
  syncStatus,      // 'idle' | 'syncing' | 'retrying' | 'error'
  syncMessage,     // string
  syncProgress,    // 0-100
  unsyncedStats,   // {patients: 0, prescriptions: 0, ...}
  totalUnsynced,   // number
  itemsInQueue,    // number
  lastSyncDetails, // {timestamp, duration, recordsSynced}
} = useSyncStatus();
```

### useSyncIndicator()
```javascript
const {
  status,          // 'online' | 'offline' | 'syncing' | 'error'
  color,           // 'green' | 'red' | 'yellow' | 'orange'
  icon,            // '🟢' | '🔴' | '🟡' | '❌'
  label,           // 'Online' | 'Offline (3 unsaved)' | ...
} = useSyncIndicator();
```

---

## 🔌 Network Detection

### Listen to Online/Offline Events
```javascript
useEffect(() => {
  window.addEventListener('online', () => {
    console.log('Back online!');
    triggerSync();
  });
  
  window.addEventListener('offline', () => {
    console.log('Lost connection');
  });
}, []);
```

### Check Current Status
```javascript
if (navigator.onLine) {
  // Online
} else {
  // Offline
}
```

---

## 💾 Database

### Initialize on App Start
```javascript
// src/main.jsx
import { initializeDatabase } from './db/dexie.js';
initializeDatabase();

import { initPWA } from './utils/pwa.js';
initPWA();
```

### Export Backup
```javascript
import { exportDatabase } from './db/dexie.js';

const backup = await exportDatabase();
// {patients: [...], prescriptions: [...], ...}

// Save to file
const blob = new Blob([JSON.stringify(backup)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'backup.json';
a.click();
```

### Clear All Data
```javascript
import { clearDatabase } from './db/dexie.js';
await clearDatabase();
```

---

## 📱 Example Component

```javascript
import { useState, useEffect } from 'react';
import * as patientService from '../services/patientService.js';
import { useNetwork } from '../hooks/useNetworkStatus.js';
import { OfflineNotification } from '../components/SyncUI.jsx';

export function PatientForm() {
  const { isOnline } = useNetwork();
  const [formData, setFormData] = useState({name: '', age: ''});
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patient = await patientService.createPatient(formData);
      setStatus(`✅ ${patient.name} created${!isOnline ? ' (offline)' : ''}`);
      setFormData({name: '', age: ''});
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!isOnline && <OfflineNotification />}
      <input 
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
        placeholder="Name"
        required
      />
      <input 
        type="number"
        value={formData.age}
        onChange={e => setFormData({...formData, age: e.target.value})}
        placeholder="Age"
        required
      />
      <button type="submit">Save</button>
      {status && <div>{status}</div>}
    </form>
  );
}
```

---

## 🐛 Debugging Checklist

```javascript
// 1. Check database
import { db, exportDatabase } from './db/dexie.js';
const backup = await exportDatabase();
console.table(backup.patients);

// 2. Check sync queue
import { getSyncQueueStatus } from './services/syncService.js';
const queue = await getSyncQueueStatus();
console.log('Pending sync:', queue);

// 3. Check network
console.log('Online:', navigator.onLine);

// 4. Check unsynced count
const stats = await patientService.getPatientStats();
console.log('Patient stats:', stats);

// 5. Check backend
fetch('http://localhost:5000/api/patients')
  .then(r => r.json())
  .then(console.log);
```

---

## 📋 Common Patterns

### Show Unsynced Badge
```javascript
{!patient.synced && <span className="badge">⏳</span>}
```

### Disable Save When Offline
```javascript
<button disabled={!isOnline}>Save</button>
```

### Show Sync Status
```javascript
{isSyncing && <p>⬆️ Syncing {syncProgress}%</p>}
{syncError && <p>❌ {syncError}</p>}
```

### Filter Unsynced
```javascript
const unsynced = await patientService.getAllPatients({
  onlyUnsynced: true
});
```

---

## ⚡ Performance Tips

- **Batch updates**: Use `batchUpdatePatients()` for multiple changes
- **Paginate reads**: Use `limit` and `offset` options
- **Lazy load**: Don't load all patients at once
- **Clear old deletes**: Purge soft-deleted records after sync confirms

---

## 🔒 Security Reminders

- ❌ Don't store sensitive data in IndexedDB
- ❌ Don't leak auth token in logs
- ✅ Token in localStorage is secure enough for this app
- ✅ All API calls include auth token automatically

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Sync not working | Check if backend running on port 5000 |
| Data not persisting | Check browser allows IndexedDB |
| Network events not firing | Clear cache, reload page |
| Can't find patient | Search returns local data only |
| Modified time wrong | Browser clock affects conflict resolution |

---

## 📚 Full Documentation

- **OFFLINE_FIRST_ARCHITECTURE.md** - Design & concepts
- **SETUP_GUIDE.md** - Installation & setup
- **OFFLINE_FIRST_INTEGRATION_GUIDE.js** - Code examples

---

**Remember**: If something isn't working, check the browser console for `[DB]`, `[Sync]`, `[API]` prefix logs!
