import { db, generateUUID } from '../db/dexie.js';

/**
 * Patient Service - Offline-first CRUD operations
 * 
 * Rules:
 * 1. ALL writes go to IndexedDB first
 * 2. Records marked synced=false until backend confirms
 * 3. All reads come from local IndexedDB
 * 4. Sync layer handles backend sync asynchronously
 */

// ============= CREATE OPERATIONS =============

/**
 * Create a new patient (offline-first)
 * @param {Object} patientData - Patient info
 * @returns {Promise<Object>} Created patient with uuid
 */
export async function createPatient(patientData) {
  try {
    const patient = {
      uuid: generateUUID(), // Client-side ID for sync
      ...patientData,
      synced: false, // Mark as not synced
      syncedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null, // For soft deletes
    };

    const id = await db.patients.add(patient);
    console.log(`[Patient] Created locally: ${patient.uuid}`);

    return { ...patient, id };
  } catch (error) {
    console.error('[Patient] Error creating patient:', error);
    throw error;
  }
}

// ============= READ OPERATIONS =============

/**
 * Get all patients from local database
 * @param {Object} options - Filter/pagination options
 * @returns {Promise<Array>} Array of patients
 */
export async function getAllPatients(options = {}) {
  try {
    const { limit = 50, offset = 0, onlyUnsynced = false } = options;

    let query = db.patients
      .where('deletedAt')
      .equals(null); // Exclude soft-deleted

    if (onlyUnsynced) {
      query = query.and((p) => p.synced === false);
    }

    const patients = await query
      .reverse()
      .sortBy('updatedAt');

    // Apply pagination
    const paginated = patients.slice(offset, offset + limit);

    console.log(
      `[Patient] Retrieved ${paginated.length} patients from local DB (total: ${patients.length})`
    );

    return paginated;
  } catch (error) {
    console.error('[Patient] Error fetching patients:', error);
    throw error;
  }
}

/**
 * Get single patient by UUID
 * @param {string} uuid - Patient UUID
 * @returns {Promise<Object>} Patient object
 */
export async function getPatientByUUID(uuid) {
  try {
    const patient = await db.patients.where('uuid').equals(uuid).first();

    if (!patient) {
      throw new Error(`Patient not found: ${uuid}`);
    }

    if (patient.deletedAt) {
      throw new Error(`Patient has been deleted: ${uuid}`);
    }

    console.log(`[Patient] Retrieved patient: ${uuid}`);
    return patient;
  } catch (error) {
    console.error('[Patient] Error fetching patient:', error);
    throw error;
  }
}

/**
 * Search patients by name or village
 * @param {string} query - Search term
 * @returns {Promise<Array>} Matching patients
 */
export async function searchPatients(query) {
  try {
    const patients = await db.patients
      .where('deletedAt')
      .equals(null)
      .toArray();

    const searchTerm = query.toLowerCase();
    const filtered = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.village.toLowerCase().includes(searchTerm) ||
        p.phone.includes(searchTerm)
    );

    console.log(`[Patient] Search "${query}" returned ${filtered.length} results`);
    return filtered;
  } catch (error) {
    console.error('[Patient] Error searching patients:', error);
    throw error;
  }
}

// ============= UPDATE OPERATIONS =============

/**
 * Update patient record
 * @param {string} uuid - Patient UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated patient
 */
export async function updatePatient(uuid, updates) {
  try {
    const patient = await getPatientByUUID(uuid);

    const updated = {
      ...patient,
      ...updates,
      synced: false, // Mark for sync
      syncedAt: null,
      updatedAt: new Date().toISOString(),
    };

    await db.patients.update(patient.id, updated);
    console.log(`[Patient] Updated locally: ${uuid}`);

    return updated;
  } catch (error) {
    console.error('[Patient] Error updating patient:', error);
    throw error;
  }
}

/**
 * Batch update multiple patients
 * @param {Array<Object>} updates - Array of {uuid, data}
 * @returns {Promise<Array>} Updated patients
 */
export async function batchUpdatePatients(updates) {
  try {
    const results = [];

    for (const { uuid, data } of updates) {
      const updated = await updatePatient(uuid, data);
      results.push(updated);
    }

    console.log(`[Patient] Batch updated ${results.length} patients`);
    return results;
  } catch (error) {
    console.error('[Patient] Error in batch update:', error);
    throw error;
  }
}

// ============= DELETE OPERATIONS =============

/**
 * Soft delete patient (marks as deleted, keeps data)
 * @param {string} uuid - Patient UUID
 * @returns {Promise<Object>} Deleted patient
 */
export async function deletePatient(uuid) {
  try {
    const patient = await getPatientByUUID(uuid);

    const deleted = {
      ...patient,
      synced: false, // Need to sync deletion
      syncedAt: null,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.patients.update(patient.id, deleted);
    console.log(`[Patient] Soft deleted: ${uuid}`);

    return deleted;
  } catch (error) {
    console.error('[Patient] Error deleting patient:', error);
    throw error;
  }
}

/**
 * Permanently delete patient from local DB (for cleanup)
 * Use this ONLY after backend confirms deletion
 * @param {string} uuid - Patient UUID
 */
export async function purgeDeletedPatient(uuid) {
  try {
    const patient = await db.patients.where('uuid').equals(uuid).first();

    if (!patient) {
      throw new Error(`Patient not found: ${uuid}`);
    }

    await db.patients.delete(patient.id);
    console.log(`[Patient] Purged from local DB: ${uuid}`);
  } catch (error) {
    console.error('[Patient] Error purging patient:', error);
    throw error;
  }
}

// ============= SYNC STATUS =============

/**
 * Get count of unsynced patients
 * @returns {Promise<number>} Count of unsynced records
 */
export async function getUnsyncedPatientCount() {
  try {
    const count = await db.patients
      .where('synced')
      .equals(false)
      .count();

    return count;
  } catch (error) {
    console.error('[Patient] Error getting unsynced count:', error);
    return 0;
  }
}

/**
 * Get all unsynced patients for sync process
 * @returns {Promise<Array>} Unsynced patients with metadata
 */
export async function getUnsyncedPatients() {
  try {
    const patients = await db.patients
      .where('synced')
      .equals(false)
      .toArray();

    console.log(`[Patient] Found ${patients.length} unsynced patients`);
    return patients;
  } catch (error) {
    console.error('[Patient] Error getting unsynced patients:', error);
    return [];
  }
}

/**
 * Mark patients as synced
 * @param {Array<string>} uuids - Patient UUIDs to mark synced
 */
export async function markPatientsSynced(uuids) {
  try {
    const now = new Date().toISOString();

    for (const uuid of uuids) {
      const patient = await db.patients.where('uuid').equals(uuid).first();
      if (patient) {
        await db.patients.update(patient.id, {
          synced: true,
          syncedAt: now,
        });
      }
    }

    console.log(`[Patient] Marked ${uuids.length} patients as synced`);
  } catch (error) {
    console.error('[Patient] Error marking patients synced:', error);
  }
}

/**
 * Mark patient as failed to sync
 * @param {string} uuid - Patient UUID
 * @param {string} reason - Error reason
 */
export async function markPatientSyncFailed(uuid, reason) {
  try {
    const patient = await db.patients.where('uuid').equals(uuid).first();
    if (!patient) return;

    await db.patients.update(patient.id, {
      synced: false,
      lastSyncError: reason,
      lastSyncAttempt: new Date().toISOString(),
    });

    console.log(`[Patient] Sync failed for ${uuid}: ${reason}`);
  } catch (error) {
    console.error('[Patient] Error marking sync failed:', error);
  }
}

// ============= UTILITIES =============

/**
 * Get patient statistics
 * @returns {Promise<Object>} Patient stats
 */
export async function getPatientStats() {
  try {
    const allPatients = await db.patients
      .where('deletedAt')
      .equals(null)
      .toArray();

    const unsynced = await db.patients
      .where('synced')
      .equals(false)
      .count();

    const deleted = await db.patients
      .where('deletedAt')
      .notEqual(null)
      .count();

    return {
      total: allPatients.length,
      unsynced,
      deleted,
      synced: allPatients.length - unsynced,
    };
  } catch (error) {
    console.error('[Patient] Error getting statistics:', error);
    return { total: 0, unsynced: 0, deleted: 0, synced: 0 };
  }
}

export default {
  create: createPatient,
  getAll: getAllPatients,
  getByUUID: getPatientByUUID,
  search: searchPatients,
  update: updatePatient,
  batchUpdate: batchUpdatePatients,
  delete: deletePatient,
  purge: purgeDeletedPatient,
  getUnsyncedCount: getUnsyncedPatientCount,
  getUnsynced: getUnsyncedPatients,
  markSynced: markPatientsSynced,
  markSyncFailed: markPatientSyncFailed,
  getStats: getPatientStats,
};
