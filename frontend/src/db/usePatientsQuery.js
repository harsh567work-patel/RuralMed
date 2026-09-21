/**
 * PowerSync Reactive Read Hooks — RuralMed
 *
 * These hooks replace useEffect + fetch patterns with reactive SQLite queries.
 * Any time PowerSync syncs new data, components using these hooks re-render
 * automatically — no polling, no manual refresh, no stale data.
 *
 * All queries run against local OPFS SQLite — they work fully offline.
 */
import { useQuery } from '@powersync/react';

// ── usePatientsQuery ──────────────────────────────────────────────────────────
/**
 * Reactively reads ALL patients from local SQLite, ordered by name.
 *
 * Returns objects in the same shape that PatientPage.jsx, PrescriptionPage.jsx,
 * ReferPage.jsx, and HomePage.jsx currently expect from the `patients` prop,
 * so those components require zero JSX changes.
 *
 * @returns {{ patients: Array, isLoading: boolean }}
 */
export function usePatientsQuery() {
  const { data: rows = [], isLoading } = useQuery(
    'SELECT * FROM patients ORDER BY name ASC'
  );

  const patients = rows.map((r) => ({
    // Core identity — matches existing component expectations
    id:          r.id,
    name:        r.name         ?? '',
    age:         r.age          ?? 0,
    gender:      r.gender       ?? 'Female',
    village:     r.village      ?? '—',
    district:    r.district     ?? '',
    phone:       r.phone        ?? '—',
    abha:        r.abha_id      ?? '',

    // Clinical
    diagnosis:   r.diagnosis    ?? 'Under Assessment',
    status:      r.status       ?? 'Active',
    lastVisit:   r.last_visit   ?? null,
    icd:         r.icd_code     ?? '',

    // Vitals
    bpSystolic:  r.bp_systolic  ?? null,
    bpDiastolic: r.bp_diastolic ?? null,
    temperature: r.temperature  ?? null,
    spo2:        r.spo2         ?? null,
    pulse:       r.pulse        ?? null,
    weight:      r.weight       ?? null,

    // Notes
    notes:          r.notes         ?? '',
    allergies:      r.allergies     ?? '',
    comorbidities:  r.comorbidities ?? '',
  }));

  return { patients, isLoading };
}

// ── usePatientPrescriptions ───────────────────────────────────────────────────
/**
 * Reactively reads all prescriptions for a specific patient, newest first.
 *
 * @param {string | null} patientId — UUID of the patient (or null to skip)
 * @returns {{ prescriptions: Array, isLoading: boolean }}
 */
export function usePatientPrescriptions(patientId) {
  const { data: prescriptions = [], isLoading } = useQuery(
    patientId
      ? 'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM prescriptions WHERE 1=0', // No-op query when no patient selected
    patientId ? [patientId] : []
  );

  return { prescriptions, isLoading };
}

// ── usePatientAppointments ────────────────────────────────────────────────────
/**
 * Reactively reads all clinical encounters for a specific patient, newest first.
 *
 * @param {string | null} patientId — UUID of the patient (or null to skip)
 * @returns {{ appointments: Array, isLoading: boolean }}
 */
export function usePatientAppointments(patientId) {
  const { data: appointments = [], isLoading } = useQuery(
    patientId
      ? 'SELECT * FROM appointments WHERE patient_id = ? ORDER BY visit_date DESC'
      : 'SELECT * FROM appointments WHERE 1=0',
    patientId ? [patientId] : []
  );

  return { appointments, isLoading };
}

// ── useDashboardStats ─────────────────────────────────────────────────────────
/**
 * Aggregated stats for the HomePage dashboard.
 * Replaces the stats.getDashboard() REST call with local SQLite aggregation.
 *
 * @returns {{ stats: Object, isLoading: boolean }}
 */
export function useDashboardStats() {
  const { data: rows = [], isLoading } = useQuery(`
    SELECT
      COUNT(*)                                             AS total_patients,
      SUM(CASE WHEN status = 'Active'    THEN 1 ELSE 0 END) AS active_patients,
      SUM(CASE WHEN status = 'Referred'  THEN 1 ELSE 0 END) AS referred_patients,
      SUM(CASE WHEN
        date(last_visit) = date('now')                     THEN 1 ELSE 0 END) AS visited_today
    FROM patients
  `);

  const row = rows[0] ?? {};
  const stats = {
    totalPatients:    row.total_patients    ?? 0,
    activePatients:   row.active_patients   ?? 0,
    referredPatients: row.referred_patients ?? 0,
    visitedToday:     row.visited_today     ?? 0,
  };

  return { stats, isLoading };
}
