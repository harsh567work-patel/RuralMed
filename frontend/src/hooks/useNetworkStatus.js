import { useEffect, useState, useCallback } from 'react';
import { performFullSync } from '../services/syncService.js';

/**
 * useNetworkStatus Hook
 * 
 * Tracks:
 * - Online/offline status
 * - Syncing state
 * - Last sync timestamp
 * 
 * Auto-triggers sync when:
 * - App starts
 * - Network comes back online
 * - Manual trigger via hook
 */

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const saved = localStorage.getItem('lastSyncTime');
    return saved ? new Date(saved) : null;
  });

  const [unsyncedCount, setUnsyncedCount] = useState(0);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) {
      console.log('[Hook] Sync skipped: already syncing or offline');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      console.log('[Hook] Triggering manual sync...');
      const result = await performFullSync();

      if (result.success) {
        setLastSyncTime(new Date());
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        console.log('[Hook] Sync successful:', result.message);
      } else {
        setSyncError(result.message);
        console.error('[Hook] Sync failed:', result.message);
      }
    } catch (error) {
      setSyncError(error.message);
      console.error('[Hook] Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Hook] Network restored');
      setIsOnline(true);
      setSyncError(null);

      // Auto-sync when connection restored
      setTimeout(() => {
        triggerSync();
      }, 500);
    };

    const handleOffline = () => {
      console.log('[Hook] Network lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  /**
   * Initial sync on mount
   */
  useEffect(() => {
    if (isOnline) {
      // Try to sync on mount if online
      const timeoutId = setTimeout(() => {
        triggerSync();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, []); // Only on mount

  return {
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    unsyncedCount,
    triggerSync,
  };
};

/**
 * Network Status Context Provider
 * Wraps the app to provide network status to all components
 */
import { createContext, useContext } from 'react';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkContext.Provider value={networkStatus}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook to use network context
 */
export function useNetwork() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }

  return context;
}

/**
 * Offline-aware wrapper for async operations
 * Prevents operations when offline
 */
export function useOfflineAware(callback, options = {}) {
  const { isOnline } = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      if (!isOnline && !options.allowOffline) {
        const msg = 'Operation requires internet connection';
        setError(msg);
        console.warn('[Hook]', msg);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await callback(...args);
        return result;
      } catch (err) {
        setError(err.message);
        console.error('[Hook] Operation failed:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isOnline, callback, options]
  );

  return { execute, isLoading, error, isOnline };
}

export default useNetworkStatus;
