import { initDatabase, closePool } from '../db/init.js';

(async () => {
  try {
    console.log('Initializing RuralMed PostgreSQL database schema...');
    await initDatabase();
    console.log('Database initialization complete (clean, no demo data).');
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    await closePool();
    process.exit(1);
  }
})();
