import { initDatabase, seedDemoData } from './init.js';

(async () => {
  try {
    console.log('Initializing RuralMed database...');
    initDatabase();
    console.log('Seeding demo data...');
    await seedDemoData();
    console.log('Database setup and seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
})();
