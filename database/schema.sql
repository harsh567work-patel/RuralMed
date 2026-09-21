-- =============================================================================
-- RuralMed Database Schema (SQLite)
-- Offline-First Rural Healthcare Management System
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. Users Table (Healthcare providers, doctors, staff)
-- -----------------------------------------------------------------------------
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
);

-- -----------------------------------------------------------------------------
-- 2. Patients Table (Demographics, vitals, village origin)
-- -----------------------------------------------------------------------------
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
);

-- -----------------------------------------------------------------------------
-- 3. Prescriptions Table (Drug orders and dosages)
-- -----------------------------------------------------------------------------
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
);

-- -----------------------------------------------------------------------------
-- 4. Referrals Table (Higher facility escalation and transport)
-- -----------------------------------------------------------------------------
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
);

-- -----------------------------------------------------------------------------
-- 5. Feedback Table (Patient / provider feedback)
-- -----------------------------------------------------------------------------
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
);

-- -----------------------------------------------------------------------------
-- 6. Inventory Table (PHC essential medicines and stock levels)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  stock INTEGER NOT NULL,
  minThreshold INTEGER NOT NULL,
  unit TEXT DEFAULT 'tablets',
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 7. Audit Logs Table (HIPAA/clinical audit trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entityId TEXT,
  changes TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
);

-- -----------------------------------------------------------------------------
-- Indexes for High Performance & Query Optimization
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_createdby ON patients(createdBy);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patientid ON prescriptions(patientId);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctorid ON prescriptions(doctorId);
CREATE INDEX IF NOT EXISTS idx_referrals_patientid ON referrals(patientId);
CREATE INDEX IF NOT EXISTS idx_referrals_referredby ON referrals(referredBy);
CREATE INDEX IF NOT EXISTS idx_feedback_userid ON feedback(userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_userid ON audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- -----------------------------------------------------------------------------
-- Default PHC Essential Medicine Inventory Seed Items
-- -----------------------------------------------------------------------------
INSERT OR IGNORE INTO inventory (name, stock, minThreshold, unit) VALUES
  ('Paracetamol 500mg', 120, 50, 'tablets'),
  ('ORS Sachet', 200, 100, 'sachets'),
  ('Amoxicillin 500mg', 80, 40, 'tablets'),
  ('Metformin 500mg', 60, 30, 'tablets'),
  ('Amlodipine 5mg', 45, 20, 'tablets'),
  ('Atenolol 50mg', 30, 20, 'tablets'),
  ('Cotrimoxazole 480mg', 18, 25, 'tablets'),
  ('Iron + Folic Acid', 150, 60, 'tablets'),
  ('Zinc Sulphate 20mg', 12, 30, 'tablets'),
  ('IV Fluid NS 500ml', 8, 15, 'bottles');
