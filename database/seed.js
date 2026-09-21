import { initDatabase, closePool } from './init.js';

(async () => {
  try {
    console.log('Initializing RuralMed PostgreSQL database schema...');
    await initDatabase();
    console.log('Database schema initialization complete (clean, no demo data).');
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    await closePool();
    process.exit(1);
  }
})();
