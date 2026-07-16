import { db } from '../db/dexie.js';
import * as patientService from './patientService.js';
import { apiCall } from './api.js';

/**
 * Sync Service - Handles synchronization between local IndexedDB and backend
 * 
 * Architecture:
 * 1. Batches unsynced records by entity type
 * 2. Sends to backend with timestamps for conflict resolution
 * 3. Handles conflicts using last-write-wins strategy
 * 4. Retries failed syncs with exponential backoff
 * 5. Maintains sync queue for failed operations
 */

let isSyncing = false;
const syncCallbacks = [];

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

// ============= SYNC STATUS =============

/**
 * Check if currently syncing
 */
export function isSyncInProgress() {
  return isSyncing;
}

/**
 * Register callback for sync events
 * @param {Function} callback - Called with {status, message, progress}
 */
export function onSyncStatusChange(callback) {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks.splice(syncCallbacks.indexOf(callback), 1);
  };
}

/**
 * Emit sync status to all listeners
 */
function emitSyncStatus(status, message, progress = 0) {
  console.log(`[Sync] ${status}: ${message}`);
  syncCallbacks.forEach((cb) => {
    try {
      cb({ status, message, progress, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Sync] Error in callback:', error);
    }
  });
}

// ============= MAIN SYNC FLOW =============

/**
 * Main sync function - called when network available
 * Syncs all unsynced records to backend
 * @returns {Promise<Object>} Sync results
 */
export async function syncData() {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[Sync] Sync already in progress, skipping');
    return { success: false, message: 'Sync already in progress' };
  }

  isSyncing = true;
  const syncStartTime = new Date();

  try {
    emitSyncStatus('syncing', 'Starting sync...');

    // Get unsynced records by type
    const unSyncedPatients = await patientService.getUnsyncedPatients();

    console.log(`[Sync] Found ${unSyncedPatients.length} unsynced patients`);

    if (unSyncedPatients.length === 0) {
      emitSyncStatus('idle', 'Everything is synced', 100);
      return {
        success: true,
        message: 'All data is synced',
        duration: new Date() - syncStartTime,
        records: 0,
      };
    }

    emitSyncStatus('syncing', `Syncing ${unSyncedPatients.length} patients...`);

    // Sync patients
    const patientResults = await syncPatients(unSyncedPatients);

    emitSyncStatus('idle', 'Sync complete', 100);

    const totalSynced = patientResults.synced;

    console.log(
      `[Sync] Completed in ${new Date() - syncStartTime}ms. Synced: ${totalSynced}`
    );

    return {
      success: true,
      message: 'Sync completed successfully',
      duration: new Date() - syncStartTime,
      records: totalSynced,
    };
  } catch (error) {
    emitSyncStatus('error', `Sync failed: ${error.message}`);
    console.error('[Sync] Critical sync error:', error);

    return {
      success: false,
      message: error.message,
      duration: new Date() - syncStartTime,
      records: 0,
    };
  } finally {
    isSyncing = false;
  }
}

// ============= SYNC PATIENTS =============

/**
 * Sync all unsynced patients to backend
 * @param {Array} patients - Unsynced patient records
 * @returns {Promise<Object>} Results {synced, failed}
 */
async function syncPatients(patients) {
  const results = { synced: 0, failed: 0, conflicts: 0 };

  console.log(`[Sync] Preparing to sync ${patients.length} patients`);

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const progress = ((i + 1) / patients.length) * 100;

    try {
      emitSyncStatus('syncing', `Syncing patient ${patient.name}...`, progress);

      // Determine operation type based on deletedAt
      const operation = patient.deletedAt ? 'delete' : patient.id ? 'update' : 'create';

      const syncedPatient = await syncPatientRecord(patient, operation);

      if (syncedPatient) {
        results.synced++;
      }
    } catch (error) {
      results.failed++;
      console.error(`[Sync] Failed to sync patient ${patient.uuid}:`, error);

      // Add to retry queue
      await addToSyncQueue(patient.uuid, 'patient', operation, error.message);

      // Try to mark as failed in DB
      await patientService.markPatientSyncFailed(patient.uuid, error.message);
    }
  }

  console.log(`[Sync] Patients sync complete:`, results);
  return results;
}

/**
 * Sync a single patient record
 * @param {Object} patient - Patient to sync
 * @param {string} operation - 'create', 'update', or 'delete'
 * @returns {Promise<Object>} Synced patient or null on failure
 */
async function syncPatientRecord(patient, operation) {
  try {
    let response;

    if (operation === 'create') {
      // New patient: POST to /patients
      response = await apiCall('POST', '/patients', {
        uuid: patient.uuid,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        village: patient.village,
        phone: patient.phone,
        diagnosis: patient.diagnosis,
        weight: patient.weight,
        bpSystolic: patient.bpSystolic,
        bpDiastolic: patient.bpDiastolic,
        temperature: patient.temperature,
        notes: patient.notes,
        updatedAt: patient.updatedAt,
      });

      console.log(`[Sync] Created patient on backend: ${patient.uuid}`);
    } else if (operation === 'update') {
      // Existing patient: PUT to /patients/:id
      response = await apiCall('PUT', `/patients/${patient.uuid}`, {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        village: patient.village,
        phone: patient.phone,
        diagnosis: patient.diagnosis,
        weight: patient.weight,
        bpSystolic: patient.bpSystolic,
        bpDiastolic: patient.bpDiastolic,
        temperature: patient.temperature,
        notes: patient.notes,
        updatedAt: patient.updatedAt,
      });

      console.log(`[Sync] Updated patient on backend: ${patient.uuid}`);
    } else if (operation === 'delete') {
      // Soft delete: DELETE to /patients/:id
      response = await apiCall('DELETE', `/patients/${patient.uuid}`, null);

      console.log(`[Sync] Deleted patient on backend: ${patient.uuid}`);
    }

    // Mark as synced locally
    await patientService.markPatientsSynced([patient.uuid]);

    return response;
  } catch (error) {
    console.error(`[Sync] Sync error for patient ${patient.uuid}:`, error);
    throw error;
  }
}

// ============= CONFLICT RESOLUTION =============

/**
 * Handle sync conflicts using last-write-wins
 * @param {Object} local - Local version
 * @param {Object} remote - Remote version
 * @returns {Object} Merged version (latest)
 */
export function resolveConflict(local, remote) {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  console.log(
    `[Sync] Conflict detected for ${local.uuid}. Local: ${localTime}, Remote: ${remoteTime}`
  );

  // Last-write-wins: use the most recent update
  const merged = localTime > remoteTime ? local : remote;

  // Log conflict for auditing
  logConflict(local.uuid, 'patient', local, remote);

  return merged;
}

/**
 * Log conflicts to conflict table
 */
async function logConflict(entityId, entityType, localVersion, remoteVersion) {
  try {
    await db.conflictLog.add({
      entityId,
      entityType,
      localVersion: JSON.stringify(localVersion),
      remoteVersion: JSON.stringify(remoteVersion),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync] Error logging conflict:', error);
  }
}

// ============= RETRY MECHANISM =============

/**
 * Add failed operation to sync queue for retry
 */
async function addToSyncQueue(entityId, entityType, operation, reason) {
  try {
    const existingItem = await db.syncQueue
      .where({ entityId, entityType })
      .first();

    if (existingItem) {
      // Update retry count
      await db.syncQueue.update(existingItem.id, {
        retryCount: (existingItem.retryCount || 0) + 1,
        lastError: reason,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Add new queue item
      await db.syncQueue.add({
        entityId,
        entityType,
        operation,
        reason,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`[Sync] Added to retry queue: ${entityId}`);
  } catch (error) {
    console.error('[Sync] Error adding to sync queue:', error);
  }
}

/**
 * Retry failed syncs from queue
 * @returns {Promise<Object>} Retry results
 */
export async function retrySyncQueue() {
  try {
    const queueItems = await db.syncQueue.toArray();

    if (queueItems.length === 0) {
      console.log('[Sync] Sync queue is empty');
      return { success: true, retried: 0 };
    }

    emitSyncStatus('retrying', `Retrying ${queueItems.length} failed operations...`);

    let retried = 0;

    for (const item of queueItems) {
      if ((item.retryCount || 0) >= RETRY_CONFIG.maxAttempts) {
        console.log(
          `[Sync] Skipping ${item.entityId} - max retries exceeded (${item.retryCount})`
        );
        continue;
      }

      try {
        // Wait before retry (exponential backoff)
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(2, item.retryCount || 0),
          RETRY_CONFIG.maxDelay
        );

        console.log(
          `[Sync] Retrying ${item.entityId} after ${delay}ms (attempt ${(item.retryCount || 0) + 1})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the operation
        if (item.entityType === 'patient') {
          const patient = await patientService.getPatientByUUID(item.entityId);
          await syncPatientRecord(patient, item.operation);
        }

        // Remove from queue on success
        await db.syncQueue.delete(item.id);
        retried++;

        console.log(`[Sync] Successfully retried: ${item.entityId}`);
      } catch (error) {
        console.error(`[Sync] Retry failed for ${item.entityId}:`, error);
        // Will try again next time
      }
    }

    emitSyncStatus('idle', `Retried ${retried} operations`, 100);

    return {
      success: retried > 0,
      retried,
      totalInQueue: queueItems.length,
    };
  } catch (error) {
    console.error('[Sync] Error retrying queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get sync queue status
 */
export async function getSyncQueueStatus() {
  try {
    const items = await db.syncQueue.toArray();
    const stats = {
      total: items.length,
      byType: {},
      oldestItem: items.length > 0 ? new Date(items[0].createdAt) : null,
    };

    items.forEach((item) => {
      if (!stats.byType[item.entityType]) {
        stats.byType[item.entityType] = 0;
      }
      stats.byType[item.entityType]++;
    });

    return stats;
  } catch (error) {
    console.error('[Sync] Error getting queue status:', error);
    return { total: 0, byType: {} };
  }
}

// ============= UTILITIES =============

/**
 * Perform full sync cycle:
 * 1. Sync unsynced records
 * 2. Retry failed operations
 */
export async function performFullSync() {
  console.log('[Sync] Starting full sync cycle');

  // First, try to sync new data
  const syncResult = await syncData();

  // Then, try to retry failed operations
  if (!isSyncing) {
    const retryResult = await retrySyncQueue();
    return {
      ...syncResult,
      retryAttempts: retryResult.retried,
    };
  }

  return syncResult;
}

/**
 * Clear sync queue (use with caution)
 */
export async function clearSyncQueue() {
  try {
    await db.syncQueue.clear();
    console.log('[Sync] Sync queue cleared');
    return true;
  } catch (error) {
    console.error('[Sync] Error clearing sync queue:', error);
    return false;
  }
}

export default {
  sync: syncData,
  isSyncing: isSyncInProgress,
  onStatusChange: onSyncStatusChange,
  retryQueue: retrySyncQueue,
  getQueueStatus: getSyncQueueStatus,
  performFullSync,
  clearQueue: clearSyncQueue,
};
