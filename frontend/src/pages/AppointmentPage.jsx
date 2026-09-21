import { useState } from 'react';
import Ic from '../components/Icons';
import { TODAY_ISO } from '../data/mockData';
import { usePowerSync } from '@powersync/react';
import { insertAppointment } from '../db/patientMutations';

export default function AppointmentPage({ patients, toast }) {
  const db = usePowerSync();
  const [selId, setSelId] = useState('');
  const [q, setQ] = useState('');
  
  // Appointment Form State
  const [visitDate, setVisitDate] = useState(TODAY_ISO);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [history, setHistory] = useState('');
  const [examFindings, setExamFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [managementPlan, setManagementPlan] = useState('');
  const [notes, setNotes] = useState('');
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const pt = patients.find(p => p.id === selId);
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase())
  );

  const saveAppointment = async () => {
    if (!selId) { toast('Select a patient first.', 'error'); return; }
    
    try {
      setLoading(true);

      await insertAppointment(db, selId, {
        visitDate,
        chiefComplaint,
        history,
        examFindings,
        diagnosis,
        managementPlan,
        notes
      });

      setSaved(true);
      toast('Appointment saved successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to save appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVisitDate(TODAY_ISO);
    setChiefComplaint('');
    setHistory('');
    setExamFindings('');
    setDiagnosis('');
    setManagementPlan('');
    setNotes('');
    setSelId('');
    setQ('');
    setSaved(false);
  };

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Appointment</h1>
          <p>Record a new clinical encounter and findings</p>
        </div>
        <div className="ph-act">
          {saved && (
            <button className="btn btn-ghost" onClick={resetForm}>+ New Appointment</button>
          )}
          <button className="btn btn-primary" onClick={saveAppointment} disabled={loading}>
            {loading ? <><span style={{ marginRight: 6 }}>⏳</span>Saving…</> : <><Ic n="save" s={14} /> Save Appointment</>}
          </button>
        </div>
      </div>

      <div className="g2">
        {/* ── LEFT COLUMN ── */}
        <div>
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Step 1: Select Patient</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>
              Search and select the patient for this encounter
            </div>
            <div className="sb mb16" style={{ maxWidth: '100%' }}>
              <Ic n="search" s={15} />
              <input
                placeholder="Search patient by name or ID..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-lt)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No patients registered yet</div>
                <div style={{ fontSize: 13 }}>Register a patient first, then come back.</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-lt)' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>No patients found</div>
                <div style={{ fontSize: 12 }}>Try a different search term</div>
              </div>
            ) : (
              <div className="ptlist">
                {filtered.map(p => (
                  <div key={p.id} className={`ptitem${selId === p.id ? ' sel' : ''}`}
                    onClick={() => { setSelId(p.id); setQ(p.name); }}>
                    <div>
                      <div className="pt-nm">{p.name}</div>
                      <div className="pt-mt">{p.id} — {p.age}y / {p.gender[0]} — {p.village}</div>
                    </div>
                    {selId === p.id && <span style={{ color: 'var(--teal)' }}><Ic n="check" s={14} /></span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pt && (
            <div className="card mb22" style={{ borderLeft: '4px solid var(--teal)' }}>
              <div className="fb">
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-.3px' }}>{pt.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3, fontWeight: 500 }}>
                    {pt.id} — {pt.age}y / {pt.gender} — {pt.village}
                  </div>
                </div>
                <span className={`badge ${pt.status === 'Active' ? 'bg-g' : 'bg-y'}`}>{pt.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <div className="card">
            <div className="card-title"><div className="ctbar" />Step 2: Encounter Details</div>
            
            <div className="field-row">
              <div className="field">
                <label>Visit Date</label>
                <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Chief Complaint</label>
              <textarea rows={2} placeholder="E.g., Fever and cough for 3 days" value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} />
            </div>

            <div className="field">
              <label>History</label>
              <textarea rows={2} placeholder="Past medical history..." value={history} onChange={e => setHistory(e.target.value)} />
            </div>

            <div className="field">
              <label>Examination Findings</label>
              <textarea rows={2} placeholder="Vitals, physical exam..." value={examFindings} onChange={e => setExamFindings(e.target.value)} />
            </div>

            <div className="field">
              <label>Diagnosis</label>
              <input type="text" placeholder="E.g., Viral Fever" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>

            <div className="field">
              <label>Management Plan</label>
              <textarea rows={2} placeholder="Plan..." value={managementPlan} onChange={e => setManagementPlan(e.target.value)} />
            </div>
            
            <div className="field">
              <label>Additional Notes</label>
              <textarea rows={1} placeholder="Any other notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
