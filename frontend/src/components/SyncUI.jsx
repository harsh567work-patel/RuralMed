import React from 'react';
import { useNetwork } from '../hooks/useNetworkStatus.js';
import { useSyncIndicator, useSyncStatus } from '../hooks/useSyncStatus.js';

/**
 * NetworkStatusBar Component
 * 
 * Displays at top of app:
 * - Online/Offline status
 * - Unsynced record count
 * - Sync progress indicator
 */
export function NetworkStatusBar() {
  const { isOnline, isSyncing, triggerSync } = useNetwork();
  const { icon, label, color } = useSyncIndicator();
  const { unsyncedStats } = useSyncStatus();

  const statusStyle = {
    padding: '8px 16px',
    backgroundColor:
      color === 'green'
        ? '#10b981'
        : color === 'red'
          ? '#ef4444'
          : color === 'yellow'
            ? '#f59e0b'
            : '#6b7280',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '500',
  };

  const unsynced =
    unsyncedStats.total > 0
      ? ` (${unsyncedStats.total} ${unsyncedStats.total === 1 ? 'change' : 'changes'} to sync)`
      : '';

  return (
    <div style={statusStyle}>
      <span>
        {icon} {label}
        {unsynced}
      </span>

      {isOnline && !isSyncing && unsyncedStats.total > 0 && (
        <button
          onClick={triggerSync}
          style={{
            marginLeft: '12px',
            padding: '4px 8px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          Sync Now
        </button>
      )}
    </div>
  );
}

/**
 * SyncProgress Component
 * 
 * Shows detailed sync status during sync operation
 */
export function SyncProgress() {
  const { syncStatus, syncMessage, syncProgress } = useSyncStatus();

  if (syncStatus !== 'syncing' && syncStatus !== 'retrying') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '16px',
        maxWidth: '300px',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        {syncStatus === 'retrying' ? '🔄 Retrying...' : '⬆️ Syncing data...'}
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
        {syncMessage}
      </div>

      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#3b82f6',
            width: `${syncProgress}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          fontSize: '11px',
          marginTop: '4px',
          color: '#999',
          textAlign: 'right',
        }}
      >
        {Math.round(syncProgress)}%
      </div>
    </div>
  );
}

/**
 * OfflineNotification Component
 * 
 * Shows when offline, hides when online
 */
export function OfflineNotification() {
  const { isOnline } = useNetwork();

  if (isOnline) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '16px',
        color: '#991b1b',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ marginRight: '8px' }}>📡</span>
      <span>
        You're offline. Changes will be saved locally and synced when your
        connection is restored.
      </span>
    </div>
  );
}

/**
 * SyncErrorAlert Component
 * 
 * Shows when sync fails
 */
export function SyncErrorAlert() {
  const { syncStatus, syncMessage } = useSyncStatus();

  if (syncStatus !== 'error') {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '16px',
        color: '#991b1b',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>
        ❌ Sync failed: {syncMessage}. Please check your connection and try
        again.
      </span>
    </div>
  );
}

/**
 * DataSyncStatus Component
 * 
 * Comprehensive sync status display
 * Shows for modals or detailed views
 */
export function DataSyncStatus() {
  const { unsyncedStats, itemsInQueue, lastSyncDetails } =
    useSyncStatus();

  const stats = [
    { label: 'Patients', count: unsyncedStats.patients },
    { label: 'Prescriptions', count: unsyncedStats.prescriptions },
    { label: 'Referrals', count: unsyncedStats.referrals },
    { label: 'Inventory', count: unsyncedStats.inventory },
  ];

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9fafb' }}>
      <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Data Sync Status</h3>

      {/* Unsynced counts */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#666' }}>
          Pending Changes
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              <div style={{ color: '#666' }}>{stat.label}</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color:
                    stat.count > 0 ? '#f59e0b' : '#10b981',
                }}
              >
                {stat.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retry queue */}
      {itemsInQueue > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#666' }}>
            Retry Queue
          </h4>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fef3c7',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#92400e',
            }}
          >
            ⚠️ {itemsInQueue} {itemsInQueue === 1 ? 'item' : 'items'} waiting to
            be synced
          </div>
        </div>
      )}

      {/* Last sync */}
      {lastSyncDetails.timestamp && (
        <div>
          <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#666' }}>
            Last Sync
          </h4>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '4px' }}>
              ✅{' '}
              {new Date(lastSyncDetails.timestamp).toLocaleTimeString()}
            </div>
            {lastSyncDetails.duration && (
              <div style={{ color: '#666' }}>
                Duration: {Math.round(lastSyncDetails.duration)}ms
              </div>
            )}
            {lastSyncDetails.recordsSynced > 0 && (
              <div style={{ color: '#666' }}>
                Records synced: {lastSyncDetails.recordsSynced}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default {
  StatusBar: NetworkStatusBar,
  Progress: SyncProgress,
  OfflineNotification,
  ErrorAlert: SyncErrorAlert,
  DataStatus: DataSyncStatus,
};
