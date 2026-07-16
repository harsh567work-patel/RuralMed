import { useState, useRef, useEffect } from 'react';
import Ic from '../components/Icons';
import { TODAY_ISO } from '../data/mockData';
import { patients as patientsAPI } from '../services/api';

const EMPTY_FORM = {
  name: '', age: '', dob: '', gender: 'Female', village: '', district: '',
  phone: '', abha: '', bp_s: '', bp_d: '', temp: '', weight: '', spo2: '',
  pulse: '', cc: '', hx: '', exam: '', dx: '', icd: '', plan: '', fu: '',
  notes: '', allergies: '', comorbid: '',
};

const ICD_CODES = [
  ['I10','Essential Hypertension'],['E11','Type 2 Diabetes Mellitus'],
  ['J06','Acute Upper Respiratory Infection'],['A15','Respiratory Tuberculosis'],
  ['D50','Iron Deficiency Anaemia'],['J45','Asthma'],['K29','Gastritis'],
  ['N39','Urinary Tract Infection'],['B50','P. Falciparum Malaria'],
];

/* ── Vitals rules (§8.1 / §8.4) ─────────────────────────────────────── */
const VITAL_RULES = {
  bp_s:   { min: 60,  max: 250, warn_lo: 90,  warn_hi: 140, label: 'Systolic BP',   unit: 'mmHg' },
  bp_d:   { min: 40,  max: 150, warn_lo: 60,  warn_hi: 90,  label: 'Diastolic BP',  unit: 'mmHg' },
  temp:   { min: 95,  max: 110, warn_lo: 97.8,warn_hi: 99,  label: 'Temperature',   unit: '°F'   },
  weight: { min: 1,   max: 300, warn_lo: null, warn_hi: null,label: 'Weight',        unit: 'kg'   },
  spo2:   { min: 50,  max: 100, warn_lo: 95,  warn_hi: null,label: 'SpO2',          unit: '%'    },
  pulse:  { min: 30,  max: 250, warn_lo: 60,  warn_hi: 100, label: 'Pulse',         unit: 'bpm'  },
};

function validateVitals(f) {
  const errors = {};
  const alerts = {};
  for (const [key, rule] of Object.entries(VITAL_RULES)) {
    const raw = f[key];
    if (!raw) continue;
    const val = parseFloat(raw);
    if (isNaN(val)) { errors[key] = `${rule.label}: enter a valid number`; continue; }
    if (val < rule.min || val > rule.max) {
      errors[key] = `${rule.label} must be ${rule.min}–${rule.max} ${rule.unit}`;
    } else {
      // Abnormal but in-range (clinical alert)
      const hiAlert = rule.warn_hi !== null && val > rule.warn_hi;
      const loAlert = rule.warn_lo !== null && val < rule.warn_lo;
      if (hiAlert) alerts[key] = 'high';
      else if (loAlert) alerts[key] = 'low';
    }
  }
  return { errors, alerts };
}

function VitalAlert({ type, label }) {
  if (!type) return null;
  const isHigh = type === 'high';
  return (
    <span style={{
      display: 'inline-block', marginTop: 3, fontSize: 11, fontWeight: 700,
      color: isHigh ? 'var(--red)' : 'var(--warn)',
      background: isHigh ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.12)',
      padding: '1px 7px', borderRadius: 4,
    }}>
      {isHigh ? '▲ High' : '▼ Low'} {label}
    </span>
  );
}

export default function PatientPage({ patients, setPatients, toast }) {
  const [tab, setTab] = useState('list');
  const [q, setQ] = useState('');
  const [f, sf] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [vitalErrors, setVitalErrors] = useState({});
  const [vitalAlerts, setVitalAlerts] = useState({});
  const dropdownRef = useRef(null);

  const set = k => e => {
    sf(p => ({ ...p, [k]: e.target.value }));
    if (k === 'name') setShowDropdown(true);
    // Live vitals validation
    if (VITAL_RULES[k]) {
      const tempF = { ...f, [k]: e.target.value };
      const { errors, alerts } = validateVitals(tempF);
      setVitalErrors(errors);
      setVitalAlerts(alerts);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase()) ||
    (p.village || '').toLowerCase().includes(q.toLowerCase())
  );

  const autocompletePatients = f.name.length > 1
    ? patients.filter(p => p.name.toLowerCase().includes(f.name.toLowerCase())).slice(0, 5)
    : [];

  const handleAutofill = (p) => {
    sf(prev => ({
      ...prev,
      name: p.name,
      age: p.age.toString(),
      gender: p.gender === 'Other' ? 'Transgender' : p.gender,
      village: p.village === '—' ? '' : p.village,
      phone: p.phone === '—' ? '' : p.phone,
      abha: p.abha || '',
      district: p.district || '',
    }));
    setShowDropdown(false);
    toast(`Autofilled details for ${p.name}`, 'success');
  };

  const save = async () => {
    if (!f.name || !f.age || !f.gender) { toast('Name, Age and Gender are required.', 'error'); return; }

    // Block on hard vitals errors
    const { errors, alerts } = validateVitals(f);
    setVitalErrors(errors);
    setVitalAlerts(alerts);
    if (Object.keys(errors).length > 0) {
      toast('Please fix the vitals errors before saving.', 'error');
      return;
    }

    try {
      setLoading(true);
      const genderMap = { 'Female': 'Female', 'Male': 'Male', 'Transgender': 'Other' };
      const normalizedGender = genderMap[f.gender] || f.gender;

      const response = await patientsAPI.create({
        name: f.name,
        age: parseInt(f.age),
        gender: normalizedGender,
        village: f.village || '—',
        phone: f.phone || '—',
        diagnosis: f.dx || 'Under Assessment',
        weight: f.weight ? parseFloat(f.weight) : null,
        bpSystolic: f.bp_s ? parseInt(f.bp_s) : null,
        bpDiastolic: f.bp_d ? parseInt(f.bp_d) : null,
        temperature: f.temp ? parseFloat(f.temp) : null,
        respiratoryRate: f.pulse ? parseInt(f.pulse) : null,
        notes: [
          f.notes,
          f.allergies ? `Allergies: ${f.allergies}` : '',
          f.comorbid   ? `Comorbidities: ${f.comorbid}` : '',
          f.abha       ? `ABHA: ${f.abha}` : '',
          f.district   ? `District: ${f.district}` : '',
        ].filter(Boolean).join('\n') || '',
      });

      const patientId = response.data.id;
      toast(`Patient ${patientId} — ${f.name} registered.`, 'success');
      setPatients(prev => [...prev, response.data]);
      sf(EMPTY_FORM);
      setVitalErrors({});
      setVitalAlerts({});
      setTab('list');
    } catch (err) {
      toast(err.message || 'Failed to save patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── helper: vital box with inline alert ─── */
  const VBox = ({ field, label, placeholder, step }) => {
    const hasError = vitalErrors[field];
    const alertType = vitalAlerts[field];
    return (
      <div className="vbox">
        <label>{label}</label>
        <input
          type="number"
          step={step || '1'}
          placeholder={placeholder}
          value={f[field]}
          onChange={set(field)}
          style={hasError ? { borderColor: 'var(--red)' } : alertType ? { borderColor: alertType === 'high' ? 'var(--red)' : 'var(--warn)' } : {}}
        />
        {hasError
          ? <span style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>{hasError}</span>
          : <VitalAlert type={alertType} label={VITAL_RULES[field].label} />}
      </div>
    );
  };

  return (
    <div>
      <div className="ph">
        <div><h1>Patient Records</h1><p>Register, search and manage all patient visits at this PHC</p></div>
        <div className="ph-act">
          <button className={`btn ${tab === 'list' ? 'btn-outline' : 'btn-primary'}`} onClick={() => setTab('list')}><Ic n="users" s={14} /> All Patients</button>
          <button className={`btn ${tab === 'new'  ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('new')} ><Ic n="plus"  s={14} /> New Registration</button>
        </div>
      </div>

      {/* ── LIST ── */}
      {tab === 'list' && (
        <div className="card">
          <div className="fb mb16">
            <div className="st"><div className="sdot" />Patient Registry — {patients.length} Total</div>
            <div className="sb"><Ic n="search" s={15} /><input placeholder="Search by name, ID or village..." value={q} onChange={e => setQ(e.target.value)} /></div>
          </div>
          {patients.length === 0 ? (
            /* Smart empty state (§8.3) */
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--gray-lt)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
            }}>
              <div style={{ fontSize: 40 }}>👤</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>No patients registered yet</div>
              <div style={{ fontSize: 13, maxWidth: 320 }}>
                Start by registering your first patient. Their records will appear here and can be used across prescriptions and referrals.
              </div>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setTab('new')}>
                <Ic n="plus" s={14} /> Register First Patient
              </button>
            </div>
          ) : (
            <div className="tw">
              <table>
                <thead><tr><th>Patient ID</th><th>Name</th><th>Age/Sex</th><th>Village</th><th>Phone</th><th>Last Visit</th><th>Diagnosis</th><th>Status</th><th>View</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-lt)', padding: '36px', fontWeight: 600 }}>No patients match your search.</td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '.4px' }}>{p.id}</td>
                      <td className="fw7">{p.name}</td>
                      <td className="gr">{p.age}y / {p.gender[0]}</td>
                      <td className="gr f13">{p.village}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray)' }}>{p.phone}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray)' }}>{p.lastVisit || '—'}</td>
                      <td className="f13">{p.diagnosis}</td>
                      <td><span className={`badge ${p.status === 'Active' ? 'bg-g' : p.status === 'Referred' ? 'bg-y' : 'bg-b'}`}>{p.status}</span></td>
                      <td><button className="btn btn-ghost btn-icon"><Ic n="eye" s={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── NEW REGISTRATION ── */}
      {tab === 'new' && (
        <div>
          <div className="alert alert-info">
            Fields marked with an asterisk are required. Patient ID is auto-generated. Records sync automatically when connectivity is available.
          </div>

          {/* Demographics */}
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Step 1: Patient Demographics</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 14, fontWeight: 500 }}>Basic identification and contact information</div>
            <div className="field-row3">
              <div className="field" style={{ position: 'relative' }} ref={dropdownRef}>
                <label>Full Name *</label>
                <input placeholder="Patient full name" value={f.name} onChange={set('name')} onFocus={() => f.name.length > 1 && setShowDropdown(true)} />
                {showDropdown && autocompletePatients.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--card-bg)', border: '1px solid var(--divider)',
                    borderRadius: 4, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: 200, overflowY: 'auto'
                  }}>
                    {autocompletePatients.map(p => (
                      <div key={p.id} onClick={() => handleAutofill(p)} style={{
                        padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--divider)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div>
                          <div className="fw7" style={{ fontSize: 14 }}>{p.name}</div>
                          <div className="gr f12">{p.id} — {p.age}y/{p.gender[0]}</div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>Autofill</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="field"><label>Age (Years) *</label><input type="number" placeholder="Age" value={f.age} onChange={set('age')} /></div>
              <div className="field"><label>Gender *</label>
                <select value={f.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Transgender</option></select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Date of Birth</label><input type="date" value={f.dob} onChange={set('dob')} /></div>
              <div className="field"><label>Phone Number</label><input type="tel" placeholder="10-digit mobile" value={f.phone} onChange={set('phone')} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Village / Hamlet</label><input placeholder="Village name" value={f.village} onChange={set('village')} /></div>
              <div className="field"><label>District</label><input placeholder="District" value={f.district} onChange={set('district')} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>ABHA Health ID</label><input placeholder="Ayushman Bharat Health Account ID (optional)" value={f.abha} onChange={set('abha')} /></div>
              <div className="field"><label>Known Allergies</label><input placeholder="Drug or food allergies" value={f.allergies} onChange={set('allergies')} /></div>
            </div>
            <div className="field"><label>Comorbidities</label><input placeholder="Diabetes, Hypertension, Asthma..." value={f.comorbid} onChange={set('comorbid')} /></div>
          </div>

          {/* Vitals — with live range validation + clinical alerts (§8.1 / §8.4) */}
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Step 2: Vitals & Measurements</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 14, fontWeight: 500 }}>Record current vital signs. Invalid ranges will be highlighted. ⚠️ alerts indicate abnormal values.</div>
            <div className="vg">
              <VBox field="bp_s"   label="Systolic BP (mmHg)"  placeholder="120" />
              <VBox field="bp_d"   label="Diastolic BP (mmHg)" placeholder="80"  />
              <VBox field="temp"   label="Temperature (°F)"    placeholder="98.6" step="0.1" />
              <VBox field="weight" label="Weight (kg)"         placeholder="60"  />
              <VBox field="spo2"   label="SpO2 (%)"            placeholder="98"  />
              <VBox field="pulse"  label="Pulse (bpm)"         placeholder="72"  />
            </div>
          </div>

          {/* Clinical */}
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Step 3: Clinical Assessment</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 14, fontWeight: 500 }}>Document patient's symptoms, examination findings, and diagnosis</div>
            <div className="field"><label>Chief Complaint</label><textarea rows={2} placeholder="Primary reason for today's visit" value={f.cc} onChange={set('cc')} /></div>
            <div className="field"><label>Clinical History</label><textarea rows={3} placeholder="Duration of symptoms, previous treatment, relevant past history..." value={f.hx} onChange={set('hx')} /></div>
            <div className="field"><label>Examination Findings</label><textarea rows={2} placeholder="Systemic examination, abdominal, respiratory findings..." value={f.exam} onChange={set('exam')} /></div>
            <div className="field-row">
              <div className="field"><label>Diagnosis</label><input placeholder="Clinical diagnosis" value={f.dx} onChange={set('dx')} /></div>
              <div className="field">
                <label>ICD-10 Code</label>
                <select value={f.icd} onChange={set('icd')}>
                  <option value="">Select ICD-10 code</option>
                  {ICD_CODES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Management Plan</label><textarea rows={2} placeholder="Treatment plan, investigations ordered, lifestyle advice..." value={f.plan} onChange={set('plan')} /></div>
            <div className="field-row">
              <div className="field"><label>Follow-up Date</label><input type="date" value={f.fu} onChange={set('fu')} /></div>
              <div className="field"><label>Additional Notes</label><input placeholder="Any additional clinical notes" value={f.notes} onChange={set('notes')} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setTab('list')} disabled={loading}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? <><span style={{ marginRight: 6 }}>⏳</span>Saving…</> : <><Ic n="save" s={14} /> Save Patient Record</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
