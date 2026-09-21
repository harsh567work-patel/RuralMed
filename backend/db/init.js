/**
 * RuralMed Backend Database Bridge
 * Connects backend to the centralized PostgreSQL database in /database/
 */
import database, {
  getDb,
  getPool,
  run,
  get,
  all,
  query,
  initDatabase,
  seedDemoData,
  closePool,
  convertPlaceholders,
} from '../../database/init.js';

export {
  getDb,
  getPool,
  run,
  get,
  all,
  query,
  initDatabase,
  seedDemoData,
  closePool,
  convertPlaceholders,
};

export default database;
