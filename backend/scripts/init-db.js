import { initDatabase, seedDemoData } from '../db/init.js';

(async () => {
  try {
    initDatabase();
    await seedDemoData();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})();
