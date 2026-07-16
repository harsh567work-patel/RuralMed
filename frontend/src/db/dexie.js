import Dexie from 'dexie';

/**
 * Local IndexedDB Database Setup using Dexie.js
 * 
 * Tables with offline-first support:
 * - All records have: id, synced (bool), updatedAt (timestamp)
 * - Soft deletes use: deletedAt (timestamp) flag
 */
export const db = new Dexie('ruralmedDB');

// Define database schema
db.version(1).stores({
  // Patients table
  patients: '++id, &uuid, createdAt, updatedAt, synced',
  
  // Prescriptions table
  prescriptions: '++id, &uuid, patientId, createdAt, updatedAt, synced',
  
  // Referrals table
  referrals: '++id, &uuid, patientId, createdAt, updatedAt, synced',
  
  // Inventory table
  inventory: '++id, &uuid, createdAt, updatedAt, synced',
  
  // Sync queue: tracks operations that failed and need retry
  syncQueue: '++id, createdAt, entityType, entityId, operation',
  
  // Conflict log: tracks conflicts during sync
  conflictLog: '++id, createdAt, entityType, entityId, localVersion, remoteVersion',
});

/**
 * Generate UUID for client-side record creation
 * Format: timestamp-random (simple but effective)
 */
export function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize database tables with default data if needed
 */
export async function initializeDatabase() {
  try {
    // Check if tables exist by checking count
    const existingPatients = await db.patients.toArray();
    console.log('[DB] Database initialized. Existing records:', {
      patients: existingPatients.length,
    });
    return true;
  } catch (error) {
    console.error('[DB] Error initializing database:', error);
    return false;
  }
}

/**
 * Clear all data from database (for testing/reset)
 */
export async function clearDatabase() {
  try {
    await db.patients.clear();
    await db.prescriptions.clear();
    await db.referrals.clear();
    await db.inventory.clear();
    await db.syncQueue.clear();
    await db.conflictLog.clear();
    console.log('[DB] Database cleared');
    return true;
  } catch (error) {
    console.error('[DB] Error clearing database:', error);
    return false;
  }
}

/**
 * Export database for backup/debugging
 */
export async function exportDatabase() {
  try {
    const backup = {
      patients: await db.patients.toArray(),
      prescriptions: await db.prescriptions.toArray(),
      referrals: await db.referrals.toArray(),
      inventory: await db.inventory.toArray(),
      syncQueue: await db.syncQueue.toArray(),
      conflictLog: await db.conflictLog.toArray(),
      exportedAt: new Date().toISOString(),
    };
    return backup;
  } catch (error) {
    console.error('[DB] Error exporting database:', error);
    throw error;
  }
}

export default db;
