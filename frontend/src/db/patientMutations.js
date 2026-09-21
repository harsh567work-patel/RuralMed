/**
 * Local SQLite Mutation Helpers
 *
 * All writes go directly to local SQLite via db.execute().
 * PowerSync automatically:
 *  1. Writes to the local OPFS SQLite file — instant, works offline
 *  2. Adds the operation to its internal CRUD queue
 *  3. Calls connector.uploadData() in the background when online
 *  4. Marks the record synced on success; retries on failure
 *
 * You do NOT need a manual outbox, a syncQueue table, or retry logic.
 */
import { v4 as uuidv4 } from 'uuid'; // Safe in both HTTP and HTTPS contexts

// ─── insertPatient ────────────────────────────────────────────────────────────
/**
 * Registers a new patient directly into local SQLite.
 *
 * @param {import('@powersync/web').PowerSyncDatabase} db  — from usePowerSync()
 * @param {Object} formData  — the `f` state object from PatientPage.jsx
 * @returns {Promise<string>} The new patient's UUID (id)
 */
export async function insertPatient(db, formData) {
  const id  = uuidv4();                  // Mod-B: uuid package, not crypto.randomUUID()
  const now = new Date().toISOString();  // Mod-C: explicit ISO 8601 timestamp

  // Normalise gender to match backend enum
  const genderMap = { Female: 'Female', Male: 'Male', Transgender: 'Other' };
  const gender = genderMap[formData.gender] ?? formData.gender;

  // Concatenate all free-text clinical notes into one notes column
  const notes = [
    formData.notes,
    formData.cc      ? `Chief Complaint: ${formData.cc}`       : '',
    formData.hx      ? `History: ${formData.hx}`               : '',
    formData.exam    ? `Examination: ${formData.exam}`          : '',
    formData.plan    ? `Management Plan: ${formData.plan}`      : '',
    formData.abha    ? `ABHA: ${formData.abha}`                 : '',
    formData.district? `District: ${formData.district}`         : '',
  ].filter(Boolean).join('\n');

  await db.execute(
    `INSERT INTO patients (
       id,
       name, age, date_of_birth, gender,
       village, district, phone, abha_id,
       diagnosis, icd_code, status,
       bp_systolic, bp_diastolic, temperature, spo2, pulse, weight,
       allergies, comorbidities, notes,
       last_visit, created_at, updated_at
     ) VALUES (
       ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?
     )`,
    [
      id,
      formData.name,
      formData.age   ? parseInt(formData.age, 10)    : null,
      formData.dob   || null,
      gender,
      formData.village  || '—',
      formData.district || '',
      formData.phone    || '—',
      formData.abha     || '',
      formData.dx       || 'Under Assessment',
      formData.icd      || '',
      'Active',
      formData.bp_s  ? parseInt(formData.bp_s, 10)   : null,
      formData.bp_d  ? parseInt(formData.bp_d, 10)   : null,
      formData.temp  ? parseFloat(formData.temp)      : null,
      formData.spo2  ? parseInt(formData.spo2, 10)   : null,
      formData.pulse ? parseInt(formData.pulse, 10)  : null,
      formData.weight? parseFloat(formData.weight)   : null,
      formData.allergies   || '',
      formData.comorbid    || '',
      notes,
      now.slice(0, 10), // last_visit = today (date only)
      now,              // created_at — ISO 8601
      now,              // updated_at — ISO 8601
    ]
  );

  return id;
}

// ─── insertAppointment ────────────────────────────────────────────────────────
/**
 * Inserts a new clinical encounter / visit for an existing patient.
 * Separate from prescriptions — tracks the encounter itself.
 *
 * @param {import('@powersync/web').PowerSyncDatabase} db
 * @param {string} patientId  — UUID of the patient
 * @param {Object} data       — encounter fields
 * @returns {Promise<string>} The new appointment's UUID
 */
export async function insertAppointment(db, patientId, data) {
  const id  = uuidv4();
  const now = new Date().toISOString(); // Mod-C

  await db.execute(
    `INSERT INTO appointments (
       id, patient_id,
       visit_date, status,
       chief_complaint, history, exam_findings,
       diagnosis, icd_code, management_plan,
       follow_up_date, notes,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      patientId,
      data.visitDate       || now.slice(0, 10),
      data.status          || 'Open',
      data.chiefComplaint  || '',
      data.history         || '',
      data.examFindings    || '',
      data.diagnosis       || '',
      data.icdCode         || '',
      data.managementPlan  || '',
      data.followUpDate    || null,
      data.notes           || '',
      now, // created_at — Mod-C
      now, // updated_at — Mod-C
    ]
  );

  return id;
}

// ─── insertPrescription ───────────────────────────────────────────────────────
/**
 * Inserts a single prescription line into local SQLite.
 * Called in a loop from PrescriptionPage for each medication in validMeds[].
 *
 * @param {import('@powersync/web').PowerSyncDatabase} db
 * @param {string} patientId         — UUID of the patient
 * @param {Object} med               — one entry from PrescriptionPage's meds[] state
 * @param {Object} [meta={}]         — { advice, rxDate, fu, appointmentId? }
 * @returns {Promise<string>} The new prescription's UUID
 */
export async function insertPrescription(db, patientId, med, meta = {}) {
  const id  = uuidv4();
  const now = new Date().toISOString(); // Mod-C

  await db.execute(
    `INSERT INTO prescriptions (
       id, patient_id, appointment_id,
       drug, dosage, frequency, duration, route, quantity,
       instructions, rx_date, follow_up_date,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      patientId,
      meta.appointmentId  || null,
      med.name.trim(),
      med.dose            || '—',
      med.freq            || 'OD',
      med.dur             || '—',
      med.route           || 'Oral',
      med.qty  ? parseInt(med.qty, 10) : null,
      meta.advice         || '',
      meta.rxDate         || now.slice(0, 10),
      meta.fu             || null,
      now, // created_at — Mod-C
      now, // updated_at — Mod-C
    ]
  );

  return id;
}
