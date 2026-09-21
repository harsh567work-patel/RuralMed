import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Dynamically resolve sqlite3 so database/ scripts work standalone or via backend
let sqlite3Module;
try {
  sqlite3Module = await import('sqlite3');
} catch (e) {
  try {
    const fallbackPath = path.resolve(__dirname, '../backend/node_modules/sqlite3/lib/sqlite3.js');
    sqlite3Module = await import(pathToFileURL(fallbackPath).href);
  } catch (err) {
    sqlite3Module = require('sqlite3');
  }
}

const sqlite3 = sqlite3Module.default || sqlite3Module;

export const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ruralmed.db');

let db;

export function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH);
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function initDatabase() {
  const db = getDb();

  // Enable foreign keys support
  db.run('PRAGMA foreign_keys = ON');

  db.serialize(() => {
    // 1. Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        facility TEXT NOT NULL,
        role TEXT DEFAULT 'doctor',
        provider TEXT DEFAULT 'local',
        googleId TEXT,
        lastLoginAt DATETIME,
        passwordResetToken TEXT,
        passwordResetExpiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0
      )
    `);

    const migrationColumns = [
      ['provider', `ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'`],
      ['googleId', `ALTER TABLE users ADD COLUMN googleId TEXT`],
      ['lastLoginAt', `ALTER TABLE users ADD COLUMN lastLoginAt DATETIME`],
      ['passwordResetToken', `ALTER TABLE users ADD COLUMN passwordResetToken TEXT`],
      ['passwordResetExpiresAt', `ALTER TABLE users ADD COLUMN passwordResetExpiresAt DATETIME`],
    ];

    migrationColumns.forEach(([columnName, sql]) => {
      db.run(sql, (err) => {
        if (err && !/duplicate column name/i.test(err.message)) {
          console.warn(`⚠️ Could not add column ${columnName}:`, err.message);
        }
      });
    });

    // 2. Patients table
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        village TEXT NOT NULL,
        phone TEXT NOT NULL,
        lastVisit TEXT,
        diagnosis TEXT,
        status TEXT DEFAULT 'Active',
        weight REAL,
        bpSystolic INTEGER,
        bpDiastolic INTEGER,
        temperature REAL,
        respiratoryRate INTEGER,
        notes TEXT,
        createdBy INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY(createdBy) REFERENCES users(id)
      )
    `);

    // 3. Prescriptions table
    db.run(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId TEXT NOT NULL,
        doctorId INTEGER NOT NULL,
        drug TEXT NOT NULL,
        dosage TEXT NOT NULL,
        duration TEXT NOT NULL,
        frequency TEXT,
        route TEXT,
        quantity INTEGER,
        instructions TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY(patientId) REFERENCES patients(id),
        FOREIGN KEY(doctorId) REFERENCES users(id)
      )
    `);

    // 4. Referrals table
    db.run(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId TEXT NOT NULL,
        referredBy INTEGER NOT NULL,
        facility TEXT NOT NULL,
        reason TEXT NOT NULL,
        date TEXT NOT NULL,
        urgency TEXT DEFAULT 'Routine',
        transport TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY(patientId) REFERENCES patients(id),
        FOREIGN KEY(referredBy) REFERENCES users(id)
      )
    `);

    // 5. Feedback table
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // 6. Inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        stock INTEGER NOT NULL,
        minThreshold INTEGER NOT NULL,
        unit TEXT DEFAULT 'tablets',
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted INTEGER DEFAULT 0
      )
    `);

    // 7. Audit logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT,
        changes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Performance Indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_patients_createdby ON patients(createdBy)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prescriptions_patientid ON prescriptions(patientId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prescriptions_doctorid ON prescriptions(doctorId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_referrals_patientid ON referrals(patientId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_referrals_referredby ON referrals(referredBy)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_userid ON feedback(userId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_userid ON audit_logs(userId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);

    // Default PHC inventory items
    const seedItems = [
      ['Paracetamol 500mg', 120, 50, 'tablets'],
      ['ORS Sachet', 200, 100, 'sachets'],
      ['Amoxicillin 500mg', 80, 40, 'tablets'],
      ['Metformin 500mg', 60, 30, 'tablets'],
      ['Amlodipine 5mg', 45, 20, 'tablets'],
      ['Atenolol 50mg', 30, 20, 'tablets'],
      ['Cotrimoxazole 480mg', 18, 25, 'tablets'],
      ['Iron + Folic Acid', 150, 60, 'tablets'],
      ['Zinc Sulphate 20mg', 12, 30, 'tablets'],
      ['IV Fluid NS 500ml', 8, 15, 'bottles'],
    ];

    const seedStmt = db.prepare(
      `INSERT OR IGNORE INTO inventory (name, stock, minThreshold, unit) VALUES (?, ?, ?, ?)`
    );
    for (const item of seedItems) {
      seedStmt.run(...item);
    }
    seedStmt.finalize();

    console.log('✓ Database initialized with foreign keys enabled and indexes created');
  });
}

/**
 * Seed demo data for showcasing system functionality
 * Only runs if no patients exist yet
 */
export async function seedDemoData() {
  try {
    const existingPatients = await all(`SELECT COUNT(*) as count FROM patients WHERE isDeleted = 0`);

    if (existingPatients && existingPatients[0]?.count > 0) {
      console.log('✓ Demo data already present, skipping seed');
      return;
    }

    // Get demo user (or create if doesn't exist)
    let demoUser = await get(`SELECT id FROM users WHERE username = 'demo_doctor' LIMIT 1`);

    if (!demoUser) {
      let bcryptjs;
      try {
        bcryptjs = (await import('bcryptjs')).default;
      } catch (e) {
        const fallbackBcrypt = path.resolve(__dirname, '../backend/node_modules/bcryptjs/index.js');
        bcryptjs = (await import(pathToFileURL(fallbackBcrypt).href)).default;
      }
      const hashedPwd = await bcryptjs.hash('demo123', 10);
      await run(
        `INSERT INTO users (username, password, email, name, facility, role) VALUES (?, ?, ?, ?, ?, ?)`,
        ['demo_doctor', hashedPwd, 'demo@phc.gov.in', 'Dr. Ananya Sharma', 'PHC Ramnagar', 'doctor']
      );
      demoUser = await get(`SELECT id FROM users WHERE username = 'demo_doctor'`);
    }

    const userId = demoUser.id;
    const today = new Date().toISOString().split('T')[0];

    const demoPatients = [
      { id: 'RM-0001', name: 'Sunita Devi', age: 42, gender: 'Female', village: 'Ramnagar', phone: '9876543210', dx: 'Hypertension - Controlled', bp_s: 135, bp_d: 88, temp: 98.2, wt: 58 },
      { id: 'RM-0002', name: 'Ramesh Kumar', age: 58, gender: 'Male', village: 'Chandpur', phone: '9812345678', dx: 'Type 2 Diabetes - Moderate', bp_s: 142, bp_d: 92, temp: 98.5, wt: 75 },
      { id: 'RM-0003', name: 'Priya Sharma', age: 28, gender: 'Female', village: 'Nandgaon', phone: '9856781234', dx: 'Iron Deficiency Anaemia', bp_s: 118, bp_d: 76, temp: 98.1, wt: 52 },
      { id: 'RM-0004', name: 'Abdul Rehman', age: 65, gender: 'Male', village: 'Fatehpur', phone: '9845671234', dx: 'COPD - with bronchodilators', bp_s: 138, bp_d: 85, temp: 98.7, wt: 68 },
      { id: 'RM-0005', name: 'Meena Bai', age: 35, gender: 'Female', village: 'Ramnagar', phone: '9823456789', dx: 'TB (treatment ongoing)', bp_s: 120, bp_d: 78, temp: 98.3, wt: 54 },
      { id: 'RM-0006', name: 'Vikram Singh', age: 48, gender: 'Male', village: 'Ramnagar', phone: '9834567890', dx: 'Essential Hypertension', bp_s: 158, bp_d: 98, temp: 98.6, wt: 72 },
      { id: 'RM-0007', name: 'Anjali Patel', age: 32, gender: 'Female', village: 'Chandpur', phone: '9845678901', dx: 'Asthma - well-controlled', bp_s: 122, bp_d: 80, temp: 98.2, wt: 56 },
      { id: 'RM-0008', name: 'Ravi Tiwari', age: 55, gender: 'Male', village: 'Nandgaon', phone: '9856789012', dx: 'Gastritis with GERD', bp_s: 128, bp_d: 82, temp: 98.4, wt: 70 },
      { id: 'RM-0009', name: 'Fatima Khan', age: 44, gender: 'Female', village: 'Fatehpur', phone: '9867890123', dx: 'Migraine - episodic', bp_s: 125, bp_d: 81, temp: 98.1, wt: 60 },
      { id: 'RM-0010', name: 'Prakash Desai', age: 62, gender: 'Male', village: 'Ramnagar', phone: '9878901234', dx: 'CKD Stage 3', bp_s: 145, bp_d: 90, temp: 98.5, wt: 66 },
    ];

    for (const pt of demoPatients) {
      await run(
        `INSERT OR IGNORE INTO patients (id, name, age, gender, village, phone, diagnosis, bpSystolic, bpDiastolic, temperature, weight, lastVisit, status, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pt.id, pt.name, pt.age, pt.gender, pt.village, pt.phone, pt.dx, pt.bp_s, pt.bp_d, pt.temp, pt.wt, today, 'Active', userId]
      );
    }

    const demoPrescriptions = [
      { patientId: 'RM-0001', drug: 'Amlodipine 5mg', dosage: '5mg', freq: 'OD', dur: 'long term', route: 'Oral' },
      { patientId: 'RM-0001', drug: 'Atenolol 50mg', dosage: '50mg', freq: 'OD', dur: 'long term', route: 'Oral' },
      { patientId: 'RM-0002', drug: 'Metformin 500mg', dosage: '500mg', freq: 'TDS', dur: 'long term', route: 'Oral' },
      { patientId: 'RM-0002', drug: 'Atorvastatin 10mg', dosage: '10mg', freq: 'OD', dur: 'long term', route: 'Oral' },
      { patientId: 'RM-0003', drug: 'Iron + Folic Acid', dosage: '1 tablet', freq: 'OD', dur: '3 months', route: 'Oral' },
      { patientId: 'RM-0005', drug: 'Isoniazid 300mg', dosage: '300mg', freq: 'OD', dur: '6 months', route: 'Oral' },
      { patientId: 'RM-0006', drug: 'Losartan 50mg', dosage: '50mg', freq: 'OD', dur: 'long term', route: 'Oral' },
      { patientId: 'RM-0007', drug: 'Salbutamol Inhaler', dosage: '2 puffs', freq: 'SOS', dur: 'as needed', route: 'Inhalation' },
    ];

    for (const rx of demoPrescriptions) {
      await run(
        `INSERT INTO prescriptions (patientId, doctorId, drug, dosage, frequency, duration, route, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [rx.patientId, userId, rx.drug, rx.dosage, rx.freq, rx.dur, rx.route, new Date().toISOString()]
      );
    }

    console.log(`✓ Demo data seeded: ${demoPatients.length} patients, ${demoPrescriptions.length} prescriptions`);
  } catch (err) {
    console.warn('⚠ Failed to seed demo data:', err.message);
  }
}

export default {
  getDb,
  run,
  get,
  all,
  initDatabase,
  seedDemoData,
  DB_PATH,
};
