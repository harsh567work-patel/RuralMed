/**
 * Audit logging middleware for RuralMed API
 * Logs all critical operations to audit_logs table
 */

import { run } from '../db/init.js';

/**
 * Audit logger middleware
 * Captures and logs database modifications
 */
export function auditLogger(action, entity) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to log after response
    res.json = function(data) {
      // Log to audit table if operation was successful
      if (res.statusCode >= 200 && res.statusCode < 300 && (action === 'CREATE' || action === 'UPDATE' || action === 'DELETE')) {
        logAudit(req.userId, action, entity, req.params.id, data).catch(err => {
          console.error('Failed to log audit:', err.message);
        });
      }

      // Call original json
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Log operation to audit_logs table
 */
export async function logAudit(userId, action, entity, entityId, changes = null) {
  try {
    const changesJson = typeof changes === 'object' ? JSON.stringify(changes) : changes;
    
    await run(
      `INSERT INTO audit_logs (userId, action, entity, entityId, changes, timestamp)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId || null, action, entity, entityId || null, changesJson]
    );
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId, limit = 100) {
  try {
    const { all } = await import('../db/init.js');
    const logs = await all(
      `SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT ?`,
      [userId, limit]
    );
    return logs;
  } catch (err) {
    console.error('Failed to retrieve audit logs:', err.message);
    return [];
  }
}
