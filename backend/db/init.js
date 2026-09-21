/**
 * RuralMed Backend Database Bridge
 * Connects backend to the centralized database in /database/
 */
import database, {
  getDb,
  run,
  get,
  all,
  initDatabase,
  seedDemoData,
  DB_PATH
} from '../../database/init.js';

export {
  getDb,
  run,
  get,
  all,
  initDatabase,
  seedDemoData,
  DB_PATH
};

export default database;
