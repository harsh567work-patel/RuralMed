/**
 * OFFLINE-FIRST ARCHITECTURE - INTEGRATION GUIDE
 * 
 * This document shows how to integrate offline-first functionality
 * into your React components and services.
 */

// ============================================
// 1. SETUP: Initialize App with Offline Support
// ============================================

// File: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { initializeDatabase } from './db/dexie.js';
import { initPWA } from './utils/pwa.js';

// Initialize database
initializeDatabase();

// Initialize PWA (offline support + caching)
initPWA();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ============================================
// 2. WRAP APP WITH NETWORK PROVIDER
// ============================================

// File: src/App.jsx
import { NetworkProvider } from './hooks/useNetworkStatus.js';
import { NetworkStatusBar } from './components/SyncUI.jsx';

function App() {
  return (
    <NetworkProvider>
      <div className="app">
        <NetworkStatusBar />
        {/* Rest of your app */}
        <YourPages />
      </div>
    </NetworkProvider>
  );
}

// ============================================
// 3. EXAMPLE: CREATE PATIENT (OFFLINE-FIRST)
// ============================================

// File: src/pages/PatientCreatePage.jsx
import { useState } from 'react';
import * as patientService from '../services/patientService.js';
import { useNetwork } from '../hooks/useNetworkStatus.js';
import { OfflineNotification } from '../components/SyncUI.jsx';

export function PatientCreatePage() {
  const { isOnline } = useNetwork();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    village: '',
    phone: '',
    diagnosis: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Create patient in local database (offline-first)
      const newPatient = await patientService.createPatient(formData);

      setSuccess(
        `Patient ${newPatient.name} created successfully!${
          !isOnline ? ' (Will sync when online)' : ''
        }`
      );

      // Reset form
      setFormData({
        name: '',
        age: '',
        gender: '',
        village: '',
        phone: '',
        diagnosis: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {!isOnline && <OfflineNotification />}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) =>
            setFormData({ ...formData, age: e.target.value })
          }
          required
        />
        <select
          value={formData.gender}
          onChange={(e) =>
            setFormData({ ...formData, gender: e.target.value })
          }
          required
        >
          <option value="">Select Gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Create Patient'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </div>
  );
}

// ============================================
// 4. EXAMPLE: READ PATIENTS (FROM LOCAL DB)
// ============================================

// File: src/pages/PatientListPage.jsx
import { useEffect, useState } from 'react';
import * as patientService from '../services/patientService.js';
import { useNetwork } from '../hooks/useNetworkStatus.js';
import { useSyncStatus } from '../hooks/useSyncStatus.js';

export function PatientListPage() {
  const { isOnline, triggerSync } = useNetwork();
  const { unsyncedStats } = useSyncStatus();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'unsynced'

  useEffect(() => {
    loadPatients();
  }, [filter]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);

      // Load from local database
      const options =
        filter === 'unsynced'
          ? { onlyUnsynced: true }
          : { limit: 50, offset: 0 };

      const data = await patientService.getAllPatients(options);
      setPatients(data);
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            fontWeight: filter === 'all' ? 'bold' : 'normal',
            marginRight: '8px',
          }}
        >
          All Patients
        </button>

        <button
          onClick={() => setFilter('unsynced')}
          style={{
            fontWeight: filter === 'unsynced' ? 'bold' : 'normal',
            marginRight: '8px',
          }}
        >
          Unsynced ({unsyncedStats.patients})
        </button>

        {isOnline && unsyncedStats.total > 0 && (
          <button onClick={triggerSync}>Sync Now</button>
        )}
      </div>

      {isLoading ? (
        <div>Loading patients...</div>
      ) : patients.length === 0 ? (
        <div>No patients found</div>
      ) : (
        <ul>
          {patients.map((patient) => (
            <li key={patient.uuid}>
              <strong>{patient.name}</strong> (Age: {patient.age})
              {patient.synced ? '✅' : '⏳ Not synced'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================
// 5. EXAMPLE: UPDATE PATIENT
// ============================================

// File: Update form
const updatePatient = async (uuid, updates) => {
  try {
    // Update in local database
    const updated = await patientService.updatePatient(uuid, updates);

    console.log('Patient updated locally:', updated);
    // If online, sync will happen in background

    return updated;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// ============================================
// 6. MANUAL SYNC TRIGGER
// ============================================

// File: settings or sync control panel
import { performFullSync } from '../services/syncService.js';

function SyncControlPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState('');

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await performFullSync();
      setStatus(result.message);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}

// ============================================
// 7. HANDLING NETWORK CHANGES
// ============================================

// This is automatic! The useNetworkStatus hook handles it:
// - When app starts: attempts sync if online
// - When connection is restored: auto-syncs
// - User can trigger manual sync via UI

// But you can also listen to sync events:
import { onSyncStatusChange } from '../services/syncService.js';

useEffect(() => {
  const unsubscribe = onSyncStatusChange((event) => {
    console.log('Sync event:', event);
    // {status: 'syncing' | 'idle' | 'error', message: string, progress: 0-100}
  });

  return () => unsubscribe();
}, []);

// ============================================
// 8. SEARCH PATIENTS
// ============================================

const searchPatients = async (query) => {
  try {
    const results = await patientService.searchPatients(query);
    return results; // All from local DB
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// ============================================
// 9. GET STATISTICS
// ============================================

const getStats = async () => {
  const stats = await patientService.getPatientStats();
  console.log('Patient stats:', stats);
  // {
  //   total: 45,
  //   unsynced: 3,
  //   deleted: 2,
  //   synced: 40
  // }
};

// ============================================
// 10. DATABASE EXPORT (FOR DEBUGGING)
// ============================================

import { exportDatabase } from '../db/dexie.js';

const backupDB = async () => {
  const backup = await exportDatabase();
  console.log('Database backup:', backup);

  // Save to file
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString()}.json`;
  a.click();
};

// ============================================
// 11. COMPLETE EXAMPLE: PATIENT EDIT PAGE
// ============================================

export function PatientEditPage({ patientUUID }) {
  const { isOnline } = useNetwork();
  const [patient, setPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState('');

  // Load patient from local DB
  useEffect(() => {
    const loadPatient = async () => {
      try {
        const data = await patientService.getPatientByUUID(patientUUID);
        setPatient(data);
        setFormData(data);
      } catch (error) {
        setStatus(`Error loading patient: ${error.message}`);
      }
    };

    loadPatient();
  }, [patientUUID]);

  const handleSave = async () => {
    try {
      // Update in local database
      const updated = await patientService.updatePatient(patientUUID, {
        name: formData.name,
        age: formData.age,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      });

      setPatient(updated);
      setIsEditing(false);
      setStatus(
        `Saved${!isOnline ? ' locally. Will sync when online.' : ''}`
      );

      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  if (!patient) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{patient.name}</h2>

      {!patient.synced && (
        <div style={{ color: '#f59e0b' }}>⏳ Changes not synced yet</div>
      )}

      {status && <div>{status}</div>}

      {isEditing ? (
        <div>
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
          <input
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData({ ...formData, diagnosis: e.target.value })
            }
          />

          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <p>Name: {patient.name}</p>
          <p>Age: {patient.age}</p>
          <p>Diagnosis: {patient.diagnosis}</p>

          {patient.synced ? <span>✅ Synced</span> : <span>⏳ Not synced</span>}

          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUMMARY
// ============================================

/**
 * KEY PRINCIPLES:
 * 
 * 1. ALWAYS read from local DB (IndexedDB)
 * 2. ALWAYS write locally first, then mark for sync
 * 3. Syncing happens automatically in background
 * 4. User always has latest local data
 * 5. Network status is visible in UI
 * 
 * TYPICAL FLOW:
 * User Action → Update Local DB → UI Updates → 
 * Auto Sync (if online) → Backend Updates → 
 * Mark as Synced
 * 
 * NO CONNECTION? 
 * All data still accessible locally
 * Changes queued for sync when back online
 * 
 * API PATTERN:
 * POST /patients (create) with {uuid, data, updatedAt}
 * PUT /patients/:uuid (update) with same
 * DELETE /patients/:uuid (soft delete)
 * GET /patients (fetch for sync verification)
 */

export default {
  PatientCreatePage,
  PatientListPage,
  PatientEditPage,
};
