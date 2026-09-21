import { useState, useEffect, useCallback } from 'react';
import { prescriptions as prescriptionsAPI } from '../services/api';

/* ── Report store (in-memory, per session) ───────────────────────── */
const _reportStore = new Map(); // patientId → { added: true }

export function getReport() {
  return Array.from(_reportStore.values());
}

export function isInReport(patientId) {
  return _reportStore.has(patientId);
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch (_e) { return d; }
}

function visitLabel(n) {
  if (n === 0) return { text: 'First Visit', color: 'var(--teal)', bg: 'var(--green-soft)' };
  if (n === 1) return { text: '2nd Visit', color: '#3B82F6', bg: '#EFF6FF' };
  if (n === 2) return { text: '3rd Visit', color: 'var(--warn)', bg: 'var(--warn-soft)' };
  return { text: `${n + 1}th Visit`, color: '#8B5CF6', bg: '#F5F3FF' };
}

/* ── Vital chip ─────────────────────────────────────────────────── */
function VChip({ label, value, unit, warn }) {
  if (!value) return null;
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: warn ? 'var(--red-soft)' : 'var(--bg)',
      border: `1.5px solid ${warn ? 'var(--red)' : 'var(--divider)'}`,
      borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700,
      color: warn ? 'var(--red)' : 'var(--navy)', gap: 2, minWidth: 68,
    }}>
      <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -.5 }}>{value}</span>
      <span style={{ fontSize: 10, opacity: .65, fontWeight: 600 }}>{unit}</span>
      <span style={{ fontSize: 9.5, opacity: .6, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</span>
    </span>
  );
}

/* ── Main Modal ─────────────────────────────────────────────────── */
export default function PatientHistoryModal({ patient, onClose }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inReport, setInReport] = useState(isInReport(patient?.id));
  const [reportNote, setReportNote] = useState('');
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);

  useEffect(() => {
    if (!patient) return;
    let cancelled = false;
    setLoading(true);
    prescriptionsAPI.getByPatient(patient.id)
      .then(data => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.data || []);
          setMeds(list);
        }
      })
      .catch((_e) => {
        if (!cancelled) setMeds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [patient?.id]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleAddToReport = () => {
    if (!showReportInput) { setShowReportInput(true); return; }
    _reportStore.set(patient.id, {
      patient,
      meds,
      note: reportNote,
      addedAt: new Date().toISOString(),
    });
    setInReport(true);
    setReportSaved(true);
    setShowReportInput(false);
    setTimeout(() => setReportSaved(false), 2500);
  };

  const handleRemoveFromReport = () => {
    _reportStore.delete(patient.id);
    setInReport(false);
  };

  if (!patient) return null;

  const visitCount = meds.length;
  const vl = visitLabel(visitCount === 0 ? 0 : visitCount - 1);
  const bpWarn = (patient.bpSystolic > 140 || patient.bpDiastolic > 90) && patient.bpSystolic;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(10,19,28,.6)',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(720px, 96vw)', maxHeight: '88vh',
        background: 'var(--bg-white)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--sh-lg)',
        zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'modalIn .22s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* ── Header ── */}
        <div style={{
          background: '#0A131C',
          padding: '22px 28px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              {/* Avatar */}
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'linear-gradient(135deg,#0A8A6A,#12B080)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#000', flexShrink: 0,
              }}>
                {patient.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -.5 }}>
                  {patient.name}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 500, marginTop: 2 }}>
                  {patient.id} &nbsp;·&nbsp; {patient.age}y / {patient.gender} &nbsp;·&nbsp; {patient.village || '—'}
                </div>
              </div>
            </div>

            {/* Visit badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: vl.bg, color: vl.color,
              padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
            }}>
              🏥 {visitCount === 0 ? 'No visits yet' : `${visitCount} visit${visitCount > 1 ? 's' : ''} on record`}
              &nbsp;—&nbsp;{vl.text}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
              color: 'rgba(255,255,255,.6)', borderRadius: '50%', width: 34, height: 34,
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>

          {/* Current Vitals */}
          {(patient.bpSystolic || patient.temperature || patient.weight) && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .9, color: 'var(--gray-lt)', marginBottom: 12 }}>
                📊 Latest Recorded Vitals
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {patient.bpSystolic && (
                  <VChip label="BP" value={`${patient.bpSystolic}/${patient.bpDiastolic}`} unit="mmHg" warn={bpWarn} />
                )}
                <VChip label="Temp" value={patient.temperature} unit="°F" warn={patient.temperature > 99} />
                <VChip label="Weight" value={patient.weight} unit="kg" />
              </div>
            </section>
          )}

          {/* Diagnosis */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .9, color: 'var(--gray-lt)', marginBottom: 10 }}>
              🩺 Current Diagnosis
            </div>
            <div style={{
              background: 'var(--bg)', border: '1.5px solid var(--divider)',
              borderRadius: 'var(--r-md)', padding: '14px 18px',
              fontSize: 15, fontWeight: 700, color: 'var(--navy)',
            }}>
              {patient.diagnosis || 'Not recorded'}
            </div>
          </section>

          {/* Patient notes (allergies, comorbidities from notes field) */}
          {patient.notes && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .9, color: 'var(--gray-lt)', marginBottom: 10 }}>
                📋 Clinical Notes
              </div>
              <div style={{
                background: 'var(--warn-soft)', border: '1.5px solid rgba(200,125,0,.2)',
                borderRadius: 'var(--r-md)', padding: '13px 18px',
                fontSize: 13, color: 'var(--navy)', lineHeight: 1.7, whiteSpace: 'pre-line',
              }}>
                {patient.notes}
              </div>
            </section>
          )}

          {/* Prescriptions / Medications */}
          <section style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .9, color: 'var(--gray-lt)',
              marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>💊 Medications Assigned ({loading ? '…' : meds.length})</span>
              {meds.length > 0 && (
                <span style={{ background: 'var(--green-soft)', color: 'var(--teal)', padding: '3px 10px', borderRadius: 100, fontSize: 10.5, fontWeight: 700 }}>
                  {meds.length} Rx on record
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--gray-lt)', fontSize: 13 }}>
                Loading medications…
              </div>
            ) : meds.length === 0 ? (
              <div style={{
                background: 'var(--bg)', border: '1.5px dashed var(--divider)',
                borderRadius: 'var(--r-md)', padding: '20px 18px', textAlign: 'center',
                color: 'var(--gray-lt)', fontSize: 13, fontWeight: 500,
              }}>
                No medications prescribed yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {meds.map((rx, i) => (
                  <div key={rx.id || i} style={{
                    background: 'var(--bg)', border: '1.5px solid var(--divider)',
                    borderRadius: 'var(--r-md)', padding: '12px 16px',
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    alignItems: 'start', gap: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 4 }}>
                        💊 {rx.drug}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--gray)', fontWeight: 500, lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy2)' }}>Dose:</span> {rx.dosage}
                        {rx.frequency && <> &nbsp;·&nbsp; <span style={{ fontWeight: 600, color: 'var(--navy2)' }}>Freq:</span> {rx.frequency}</>}
                        {rx.duration && <> &nbsp;·&nbsp; <span style={{ fontWeight: 600, color: 'var(--navy2)' }}>Duration:</span> {rx.duration}</>}
                        {rx.route && <> &nbsp;·&nbsp; <span style={{ fontWeight: 600, color: 'var(--navy2)' }}>Route:</span> {rx.route}</>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10.5, color: 'var(--gray-lt)', fontWeight: 600,
                        background: 'var(--bg-white)', border: '1px solid var(--divider)',
                        padding: '3px 9px', borderRadius: 100,
                      }}>
                        {fmtDate(rx.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Last Visit */}
          <section style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .9, color: 'var(--gray-lt)', marginBottom: 10 }}>
              🗓 Visit Timeline
            </div>
            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{
                background: 'var(--bg)', border: '1.5px solid var(--divider)',
                borderRadius: 'var(--r-md)', padding: '12px 18px', flex: 1, minWidth: 140,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .7, color: 'var(--gray-lt)', marginBottom: 4 }}>Last Visit</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{fmtDate(patient.lastVisit)}</div>
              </div>
              <div style={{
                background: 'var(--bg)', border: '1.5px solid var(--divider)',
                borderRadius: 'var(--r-md)', padding: '12px 18px', flex: 1, minWidth: 140,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .7, color: 'var(--gray-lt)', marginBottom: 4 }}>Total Visits</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', letterSpacing: -1.5 }}>{visitCount}</div>
              </div>
              <div style={{
                background: 'var(--bg)', border: '1.5px solid var(--divider)',
                borderRadius: 'var(--r-md)', padding: '12px 18px', flex: 1, minWidth: 140,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .7, color: 'var(--gray-lt)', marginBottom: 4 }}>Status</div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                  borderRadius: 100, fontSize: 12, fontWeight: 700,
                  background: patient.status === 'Active' ? 'var(--green-soft)' : 'var(--warn-soft)',
                  color: patient.status === 'Active' ? 'var(--teal)' : 'var(--warn)',
                }}>
                  ● {patient.status || 'Active'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer: Add to Report ── */}
        <div style={{
          flexShrink: 0, borderTop: '1.5px solid var(--divider)',
          padding: '16px 28px', background: 'var(--bg)',
        }}>
          {reportSaved && (
            <div style={{
              background: 'var(--green-soft)', border: '1.5px solid rgba(10,138,106,.2)',
              borderRadius: 'var(--r-md)', padding: '10px 16px', marginBottom: 12,
              fontSize: 13, fontWeight: 600, color: 'var(--teal)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✅ Added to doctor's queue report! The doctor will see this patient's history before consultation.
            </div>
          )}

          {showReportInput && !inReport && (
            <div style={{ marginBottom: 12 }}>
              <textarea
                rows={2}
                placeholder="Optional: add a note for the doctor (e.g. 'Patient complains of chest pain since 3 days')"
                value={reportNote}
                onChange={e => setReportNote(e.target.value)}
                style={{
                  width: '100%', border: '1.5px solid var(--divider)', borderRadius: 'var(--r-md)',
                  padding: '10px 14px', fontFamily: 'var(--font)', fontSize: 13,
                  color: 'var(--navy)', background: 'var(--bg-white)', outline: 'none',
                  resize: 'vertical', minHeight: 64,
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, color: 'var(--gray)', fontWeight: 500 }}>
              {inReport
                ? '📋 This patient is queued in the doctor\'s report.'
                : 'Add to report so the doctor sees this history when the patient\'s turn arrives.'}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--bg-white)', border: '1.5px solid var(--divider)',
                  color: 'var(--gray)', borderRadius: 100, padding: '9px 20px',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                Close
              </button>

              {inReport ? (
                <button
                  onClick={handleRemoveFromReport}
                  style={{
                    background: 'var(--red-soft)', border: '1.5px solid rgba(232,64,64,.25)',
                    color: 'var(--red)', borderRadius: 100, padding: '9px 20px',
                    fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  ✕ Remove from Report
                </button>
              ) : (
                <button
                  onClick={handleAddToReport}
                  style={{
                    background: '#0A131C', color: '#fff',
                    border: 'none', borderRadius: 100, padding: '9px 22px',
                    fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  📋 {showReportInput ? 'Save to Doctor\'s Report' : 'Add to Doctor\'s Report'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform: translate(-50%,-52%) scale(.96); }
          to   { opacity:1; transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </>
  );
}
