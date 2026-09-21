/**
 * PowerSync Client Setup — RuralMed
 *
 * Creates the PowerSyncDatabase singleton backed by OPFS (Origin Private File System).
 * Exports both:
 *   - `db`                   — the PowerSyncDatabase instance for direct use
 *   - `PowerSyncProvider`    — React context provider wrapping the app
 *
 * Graceful degradation:
 *   - If VITE_POWERSYNC_URL is empty → local SQLite only (no sync), fully offline-capable
 *   - If VITE_POWERSYNC_URL is set   → connects to PowerSync Service and syncs to PostgreSQL
 *
 * NOTE: This file uses React.createElement instead of JSX because Vite does not
 * process JSX in .js files — only in .jsx/.tsx. This avoids a rename.
 */
import { createElement }      from 'react';
import { PowerSyncDatabase }  from '@powersync/web';
import { PowerSyncContext }   from '@powersync/react';
import { AppSchema }          from './schema';
import { RuralMedConnector }  from './connector';

// ── Singleton database instance ───────────────────────────────────────────────
// Created once at module evaluation time. The OPFS file `ruralmed-ps.db` is
// stored in the browser's Origin Private File System — isolated, persistent,
// and not accessible to other origins.
export const db = new PowerSyncDatabase({
  schema:   AppSchema,
  database: {
    dbFilename: 'ruralmed-ps.db',
  },
});

// ── Connect to PowerSync Service (if configured) ──────────────────────────────
const connector = new RuralMedConnector();

if (import.meta.env.VITE_POWERSYNC_URL) {
  db.connect(connector)
    .then(() => console.info('[PS Setup] Connected to PowerSync Service'))
    .catch((err) => console.error('[PS Setup] connect() failed — check VITE_POWERSYNC_URL:', err.message));
} else {
  console.info('[PS Setup] VITE_POWERSYNC_URL not set — running in offline-only mode (local SQLite only)');
}

// ── React Provider ────────────────────────────────────────────────────────────
/**
 * Wrap your app root with this provider.
 * All child components can then call usePowerSync() or useQuery() from @powersync/react.
 *
 * Written with React.createElement (no JSX) so this .js file builds correctly.
 *
 * Usage in main.jsx:
 *   <PowerSyncProvider>
 *     <App />
 *   </PowerSyncProvider>
 */
export function PowerSyncProvider({ children }) {
  // Equivalent to: <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  return createElement(PowerSyncContext.Provider, { value: db }, children);
}
