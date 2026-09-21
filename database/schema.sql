-- =============================================================================
-- RuralMed Database Schema (PostgreSQL)
-- Offline-First Rural Healthcare Management System
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Users Table (Healthcare providers, doctors, staff)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  facility VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'doctor',
  provider VARCHAR(50) DEFAULT 'local',
  googleId VARCHAR(255),
  lastLoginAt TIMESTAMPTZ,
  passwordResetToken VARCHAR(255),
  passwordResetExpiresAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 2. Patients Table (Demographics, vitals, village origin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(50) NOT NULL,
  village VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  lastVisit TEXT,
  diagnosis TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  weight NUMERIC,
  bpSystolic INTEGER,
  bpDiastolic INTEGER,
  temperature NUMERIC,
  respiratoryRate INTEGER,
  notes TEXT,
  createdBy INTEGER NOT NULL REFERENCES users(id),
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 3. Prescriptions Table (Drug orders and dosages)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  patientId VARCHAR(255) NOT NULL REFERENCES patients(id),
  doctorId INTEGER NOT NULL REFERENCES users(id),
  drug VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  duration VARCHAR(255) NOT NULL,
  frequency VARCHAR(100),
  route VARCHAR(100),
  quantity INTEGER,
  instructions TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 4. Referrals Table (Higher facility escalation and transport)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  patientId VARCHAR(255) NOT NULL REFERENCES patients(id),
  referredBy INTEGER NOT NULL REFERENCES users(id),
  facility VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  urgency VARCHAR(50) DEFAULT 'Routine',
  transport TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 5. Feedback Table (Patient / provider feedback)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 6. Inventory Table (PHC essential medicines and stock levels)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  stock INTEGER NOT NULL,
  minThreshold INTEGER NOT NULL,
  unit VARCHAR(50) DEFAULT 'tablets',
  lastUpdated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 7. Audit Logs Table (HIPAA/clinical audit trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entityId VARCHAR(255),
  changes TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
