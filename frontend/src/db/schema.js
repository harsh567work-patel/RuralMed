/**
 * PowerSync Local SQLite Schema
 *
 * Defines the three tables that PowerSync manages locally and syncs to PostgreSQL.
 * PowerSync automatically adds `id TEXT PRIMARY KEY` to every table — do not declare it.
 *
 * Column types available: column.text | column.integer | column.real
 * All nullable by default in SQLite. NULL handling matches PostgreSQL defaults.
 */
import { Schema, Table, column } from '@powersync/web';

// ── patients ──────────────────────────────────────────────────────────────────
// Core patient demographic record. One row per registered patient.
const patients = new Table(
  {
    // Demographics
    name:           column.text,    // Full patient name (required)
    age:            column.integer, // Age in years
    date_of_birth:  column.text,    // ISO 8601 date string e.g. "1990-05-14"
    gender:         column.text,    // 'Male' | 'Female' | 'Other'

    // Contact & Location
    village:        column.text,    // Village / hamlet name
    district:       column.text,    // District name
    phone:          column.text,    // 10-digit mobile number or '—'
    abha_id:        column.text,    // Ayushman Bharat Health Account ID (optional)

    // Clinical Summary
    diagnosis:      column.text,    // Primary diagnosis e.g. 'Type 2 Diabetes Mellitus'
    icd_code:       column.text,    // ICD-10 code e.g. 'E11'
    status:         column.text,    // 'Active' | 'Referred' | 'Discharged'

    // Vitals
    bp_systolic:    column.integer, // Systolic BP in mmHg (range 60-250)
    bp_diastolic:   column.integer, // Diastolic BP in mmHg (range 40-150)
    temperature:    column.real,    // Body temperature in °F (range 95-110)
    spo2:           column.integer, // Oxygen saturation % (range 50-100)
    pulse:          column.integer, // Pulse rate bpm (range 30-250)
    weight:         column.real,    // Weight in kg (range 1-300)

    // Additional Clinical Info
    allergies:      column.text,    // Known drug / food allergies
    comorbidities:  column.text,    // Comorbid conditions e.g. 'Diabetes, Hypertension'
    notes:          column.text,    // Concatenated clinical notes (CC, Hx, Exam, Plan)

    // Timestamps
    last_visit:     column.text,    // ISO 8601 date of last recorded visit
    created_at:     column.text,    // ISO 8601 — set on INSERT, never updated
    updated_at:     column.text,    // ISO 8601 — updated on every mutation
  },
  { indexes: { by_name: ['name'], by_status: ['status'] } }
);

// ── appointments ──────────────────────────────────────────────────────────────
// Clinical encounters / visits. One row per visit. Separate from prescriptions.
const appointments = new Table(
  {
    // Relation
    patient_id:      column.text,   // FK → patients.id (UUID)

    // Visit Metadata
    visit_date:      column.text,   // ISO 8601 date of encounter
    status:          column.text,   // 'Open' | 'Closed' | 'Referred'

    // Clinical Content
    chief_complaint: column.text,   // Primary reason for today's visit
    history:         column.text,   // Duration of symptoms, past history, prior treatment
    exam_findings:   column.text,   // Systemic / abdominal / respiratory findings
    diagnosis:       column.text,   // Visit-level clinical diagnosis
    icd_code:        column.text,   // ICD-10 code for this specific visit
    management_plan: column.text,   // Treatment plan, investigations, lifestyle advice
    follow_up_date:  column.text,   // Scheduled follow-up date ISO 8601
    notes:           column.text,   // Additional encounter-level notes

    // Timestamps
    created_at:      column.text,   // ISO 8601 — set on INSERT
    updated_at:      column.text,   // ISO 8601 — updated on every mutation
  },
  { indexes: { by_patient: ['patient_id'], by_date: ['visit_date'] } }
);

// ── prescriptions ─────────────────────────────────────────────────────────────
// Individual prescription lines. One row per drug per encounter.
const prescriptions = new Table(
  {
    // Relations
    patient_id:     column.text,    // FK → patients.id (UUID)
    appointment_id: column.text,    // FK → appointments.id (UUID, optional)

    // Drug Details
    drug:           column.text,    // Drug name + formulation e.g. 'Paracetamol 500mg'
    dosage:         column.text,    // Dose e.g. '500mg', '1 sachet in 200ml'
    frequency:      column.text,    // Frequency code: 'OD' | 'BD' | 'TDS' | 'QID' | 'SOS' …
    duration:       column.text,    // Duration string e.g. '5 days', 'Long term'
    route:          column.text,    // Admin route: 'Oral' | 'IV' | 'IM' | 'SC' | 'Topical' …
    quantity:       column.integer, // Tablet / unit quantity dispensed

    // Context
    instructions:   column.text,   // Doctor advice / special instructions
    rx_date:        column.text,   // ISO 8601 date of prescription
    follow_up_date: column.text,   // Follow-up date ISO 8601

    // Timestamps
    created_at:     column.text,   // ISO 8601 — set on INSERT
    updated_at:     column.text,   // ISO 8601 — updated on every mutation
  },
  { indexes: { by_patient: ['patient_id'], by_appointment: ['appointment_id'] } }
);

// ── Export the composed schema ────────────────────────────────────────────────
export const AppSchema = new Schema({ patients, appointments, prescriptions });
