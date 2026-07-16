import { useEffect, useState } from 'react';
import { onSyncStatusChange, getSyncQueueStatus } from '../services/syncService.js';
import * as patientService from '../services/patientService.js';

/**
 * useSyncStatus Hook
 * 
 * Provides real-time sync information:
 * - Current sync status (idle, syncing, retrying, error)
 * - Unsynced record counts
 * - Sync queue information
 * - Last sync details
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, retrying, error
  const [syncMessage, setSyncMessage] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);

  const [unsyncedStats, setUnsyncedStats] = useState({
    patients: 0,
    prescriptions: 0,
    referrals: 0,
    inventory: 0,
    total: 0,
  });

  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    byType: {},
    oldestItem: null,
  });

  const [lastSyncDetails, setLastSyncDetails] = useState({
    timestamp: null,
    duration: null,
    recordsSynced: 0,
  });

  /**
   * Update unsynced counts
   */
  const updateUnsyncedCounts = async () => {
    try {
      const patientCount = await patientService.getUnsyncedPatientCount();

      setUnsyncedStats((prev) => ({
        ...prev,
        patients: patientCount,
        total: patientCount, // Add more counts when other modules are implemented
      }));
    } catch (error) {
      console.error('[SyncStatus] Error updating counts:', error);
    }
  };

  /**
   * Update queue status
   */
  const updateQueueStatus = async () => {
    try {
      const status = await getSyncQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('[SyncStatus] Error updating queue:', error);
    }
  };

  /**
   * Listen to sync status changes
   */
  useEffect(() => {
    const unsubscribe = onSyncStatusChange((event) => {
      setSyncStatus(event.status);
      setSyncMessage(event.message);
      setSyncProgress(event.progress);

      // Update counts when sync completes
      if (event.status === 'idle') {
        updateUnsyncedCounts();
      }
    });

    // Initial load
    updateUnsyncedCounts();
    updateQueueStatus();

    // Poll for updates
    const interval = setInterval(() => {
      updateUnsyncedCounts();
      updateQueueStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  /**
   * Record sync completion
   */
  const recordSyncCompletion = (duration, recordsSynced) => {
    setLastSyncDetails({
      timestamp: new Date(),
      duration,
      recordsSynced,
    });
    localStorage.setItem(
      'lastSyncDetails',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        duration,
        recordsSynced,
      })
    );
  };

  return {
    // Status
    syncStatus, // 'idle' | 'syncing' | 'retrying' | 'error'
    syncMessage,
    syncProgress,
    issyncing: syncStatus === 'syncing',
    isRetrying: syncStatus === 'retrying',
    hasError: syncStatus === 'error',

    // Counts
    unsyncedStats,
    totalUnsynced: unsyncedStats.total,

    // Queue
    queueStatus,
    itemsInQueue: queueStatus.total,
    oldestQueueItem: queueStatus.oldestItem,

    // History
    lastSyncDetails,

    // Actions
    updateCounts: updateUnsyncedCounts,
    updateQueue: updateQueueStatus,
    recordSync: recordSyncCompletion,
  };
}

/**
 * Hook for displaying sync indicators in UI
 * Returns status code, color, and icon
 */
export function useSyncIndicator() {
  const { isOnline } = require('./useNetworkStatus.js').useNetworkStatus() || {
    isOnline: true,
  };
  const { syncStatus, unsyncedStats } = useSyncStatus();

  let status = 'online'; // 'online' | 'offline' | 'syncing' | 'error'
  let color = 'green'; // For UI rendering
  let icon = '🟢'; // For display
  let label = 'Online';

  if (!isOnline) {
    status = 'offline';
    color = 'red';
    icon = '🔴';
    label = `Offline (${unsyncedStats.total} unsaved)`;
  } else if (syncStatus === 'syncing') {
    status = 'syncing';
    color = 'yellow';
    icon = '🟡';
    label = 'Syncing...';
  } else if (syncStatus === 'retrying') {
    status = 'retrying';
    color = 'orange';
    icon = '⚠️';
    label = 'Retrying sync...';
  } else if (syncStatus === 'error') {
    status = 'error';
    color = 'red';
    icon = '❌';
    label = 'Sync failed';
  }

  return { status, color, icon, label };
}

export default useSyncStatus;
