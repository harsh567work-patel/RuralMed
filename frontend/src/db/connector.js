/**
 * PowerSync System Connector — RuralMed
 *
 * Implements the PowerSync `SystemConnector` interface, which is the bridge
 * between the local SQLite mutation queue and the Express backend.
 *
 * PowerSync calls:
 *  - fetchCredentials() → before opening the sync WebSocket, and on token expiry
 *  - uploadData(database) → when local mutations are queued and network is available
 */
import { getStoredAuthSession } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const PS_URL   = import.meta.env.VITE_POWERSYNC_URL || '';

export class RuralMedConnector {
  // ─── fetchCredentials ──────────────────────────────────────────────────────
  /**
   * Called by PowerSync to get the JWT needed for the sync WebSocket.
   * Hits our /api/auth/powersync-token endpoint which mints a 1-hour JWT.
   *
   * Returns null (graceful offline-only mode) when VITE_POWERSYNC_URL is empty.
   */
  async fetchCredentials() {
    if (!PS_URL) {
      // No PowerSync Service URL configured — stay in offline-only mode.
      // The local SQLite database still works perfectly; data is just not synced.
      console.info('[PS Connector] No VITE_POWERSYNC_URL — running offline-only. Sync is disabled.');
      return null;
    }

    const appToken = getStoredAuthSession().token; // Existing session JWT from login
    if (!appToken) {
      console.warn('[PS Connector] fetchCredentials called but no session token found — user may be logged out.');
      return null;
    }

    const res = await fetch(`${API_BASE}/auth/powersync-token`, {
      method: 'GET',
      headers: {
        'Authorization':  `Bearer ${appToken}`,
        'Content-Type':   'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[PS Connector] fetchCredentials failed (${res.status}): ${text}`);
    }

    const { token, expiresAt } = await res.json();

    return {
      endpoint:  PS_URL,   // PowerSync Service WebSocket URL
      token,               // Short-lived JWT (1h) signed by our backend
      expiresAt,           // ISO 8601 — PowerSync calls fetchCredentials again before this
    };
  }

  // ─── uploadData ────────────────────────────────────────────────────────────
  /**
   * Called by PowerSync when local mutations need to be sent to the backend.
   * Processes the CRUD queue table-by-table, operation-by-operation.
   *
   * PowerSync CRUD operations:
   *  - 'PUT'    → covers both INSERT and UPDATE (treat as upsert on the backend)
   *  - 'DELETE' → soft or hard delete on the backend
   *  - 'PATCH'  → partial update (rarely used, handle same as PUT)
   *
   * IMPORTANT: Only call transaction.complete() after ALL operations succeed.
   * If any throw, do NOT complete — PowerSync will retry the entire batch.
   */
  async uploadData(database) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return; // Queue is empty

    const appToken = getStoredItem('token');
    const headers = {
      'Content-Type':     'application/json',
      'Authorization':    `Bearer ${appToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    };

    try {
      for (const op of transaction.crud) {
        const { table, op: operation, id, opData } = op;

        // ── patients ────────────────────────────────────────────────────────
        if (table === 'patients') {
          if (operation === 'PUT' || operation === 'PATCH') {
            // Backend PUT /api/patients/:id should be idempotent (upsert).
            // opData contains the full row minus id; we include id in body as uuid.
            await this._fetch(`${API_BASE}/patients/${id}`, 'PUT', { ...opData, uuid: id }, headers);
          } else if (operation === 'DELETE') {
            await this._fetch(`${API_BASE}/patients/${id}`, 'DELETE', null, headers);
          }
        }

        // ── appointments ────────────────────────────────────────────────────
        else if (table === 'appointments') {
          if (operation === 'PUT' || operation === 'PATCH') {
            await this._fetch(`${API_BASE}/appointments/${id}`, 'PUT', { ...opData, uuid: id }, headers);
          } else if (operation === 'DELETE') {
            await this._fetch(`${API_BASE}/appointments/${id}`, 'DELETE', null, headers);
          }
        }

        // ── prescriptions ───────────────────────────────────────────────────
        else if (table === 'prescriptions') {
          if (operation === 'PUT' || operation === 'PATCH') {
            await this._fetch(`${API_BASE}/prescriptions/${id}`, 'PUT', { ...opData, uuid: id }, headers);
          } else if (operation === 'DELETE') {
            await this._fetch(`${API_BASE}/prescriptions/${id}`, 'DELETE', null, headers);
          }
        }

        else {
          console.warn(`[PS Connector] uploadData: unknown table "${table}" — skipping`);
        }
      }

      // ✅ All operations succeeded — remove this batch from the queue
      await transaction.complete();
      console.info(`[PS Connector] uploadData: ${transaction.crud.length} operation(s) uploaded`);
    } catch (err) {
      // ❌ Do NOT call transaction.complete() on failure.
      // PowerSync will automatically retry on the next sync cycle.
      console.error('[PS Connector] uploadData failed — will retry:', err.message);
      throw err;
    }
  }

  // ─── _fetch helper ─────────────────────────────────────────────────────────
  async _fetch(url, method, body, headers) {
    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[PS Connector] ${method} ${url} → ${res.status}: ${text}`);
    }
    return res;
  }
}
