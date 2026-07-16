import { useState } from 'react';
import Ic from '../components/Icons';
import { DRUGS, TODAY_ISO } from '../data/mockData';
import { prescriptions as prescriptionsAPI } from '../services/api';

export default function PrescriptionPage({ patients, toast }) {
  const [selId, setSelId] = useState('');
  const [q, setQ]         = useState('');
  const [meds, setMeds]   = useState([{ id: 1, name: '', dose: '', freq: 'OD', dur: '', route: 'Oral', qty: '' }]);
  const [advice, setAdvice] = useState('');
  const [fu, setFu]         = useState('');
  const [rxDate, setRxDate] = useState(TODAY_ISO);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  const pt       = patients.find(p => p.id === selId);
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase())
  );

  const addMed = () => setMeds(m => [...m, { id: Date.now(), name: '', dose: '', freq: 'OD', dur: '', route: 'Oral', qty: '' }]);
  const upd    = (id, k, v) => setMeds(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));
  const del    = id => setMeds(m => m.filter(x => x.id !== id));

  const savePx = async () => {
    if (!selId)        { toast('Please select a patient first.', 'error'); return; }
    if (!meds[0].name) { toast('Add at least one medication.', 'error');   return; }
    
    try {
      setLoading(true);
      // Save each medication as a separate prescription
      for (const med of meds) {
        if (med.name) {
          await prescriptionsAPI.create({
            patientId: selId,
            drug: med.name,
            dosage: med.dose,
            duration: med.dur,
            frequency: med.freq,
            route: med.route,
            quantity: med.qty ? parseInt(med.qty) : null,
            instructions: advice || '',
          });
        }
      }
      setSaved(true);
      toast('Prescription saved successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to save prescription', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div><h1>Prescription</h1><p>Write prescriptions — templates auto-fill common drug regimens</p></div>
        <div className="ph-act">
          {saved && <button className="btn btn-outline" onClick={() => window.print()}><Ic n="print" s={14} /> Print Rx</button>}
          <button className="btn btn-primary" onClick={savePx} disabled={loading}>
            {loading ? <><span style={{ marginRight: 6 }}>⏳</span>Saving…</> : <><Ic n="save" s={14} /> Save Prescription</>}
          </button>
        </div>
      </div>

      <div className="g2">
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Patient selector */}
          <div className="card mb22">
              <div className="card-title"><div className="ctbar" />Step 1: Select Patient</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Search and select the patient for whom you're writing this prescription</div>
            <div className="sb mb16" style={{ maxWidth: '100%' }}>
              <Ic n="search" s={15} />
              <input placeholder="Search patient by name or ID..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-lt)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No patients registered yet</div>
                <div style={{ fontSize: 13, margin: '0 auto 16px', maxWidth: 300 }}>
                  You need to register patients first. Go to <strong>Patient Records</strong> and create a patient entry, then come back here to write a prescription.
                </div>
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

          {/* Selected patient card */}
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
              <div className="divider" />
              <div className="field-row">
                <div><div className="sl">Diagnosis</div><div className="fw7">{pt.diagnosis}</div></div>
                <div><div className="sl">Last Visit</div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>{pt.lastVisit}</div></div>
              </div>
            </div>
          )}

          {/* Prescription meta */}
          <div className="card">
            <div className="card-title"><div className="ctbar" />Step 2: Prescription Details</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Set the prescription date and any physician advice</div>
            <div className="field-row">
              <div className="field"><label>Prescription Date</label><input type="date" value={rxDate} onChange={e => setRxDate(e.target.value)} /></div>
              <div className="field"><label>Follow-up Visit</label><input type="date" value={fu} onChange={e => setFu(e.target.value)} /></div>
            </div>
            <div className="field">
              <label>Doctor Advice</label>
              <textarea placeholder="Rest, diet restrictions, hydration, activity levels..." value={advice} onChange={e => setAdvice(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <div className="card">
            <div className="card-title"><div className="ctbar" />Step 3: Add Medications ({meds.length})</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Select drugs, specify dose, frequency and duration</div>
            <div className="fb mb16">
              <div className="st"><div className="sdot" />Medications ({meds.length})</div>
              <button className="btn btn-teal btn-sm" onClick={addMed}><Ic n="plus" s={13} /> Add Drug</button>
            </div>

            {/* Quick templates */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {['Paracetamol 500mg', 'ORS Sachet', 'Amoxicillin 500mg', 'Metformin 500mg'].map(t => (
                <button key={t} className="btn btn-ghost btn-sm"
                  style={{ border: '1.5px solid var(--divider)', borderRadius: '100px' }}
                  onClick={() => setMeds(m => [...m, { id: Date.now(), name: t, dose: '', freq: 'TDS', dur: '5 days', route: 'Oral', qty: '' }])}>
                  + {t}
                </button>
              ))}
            </div>

            <div className="divider" />
            <div className="rx-hd c">
              <span>#</span><span>Drug / Formulation</span><span>Dose</span><span>Frequency</span><span>Duration</span><span>Qty</span><span></span>
            </div>

            {meds.map((m, i) => (
              <div key={m.id} className="rx-row">
                <div className="rx-n">{i + 1}</div>
                <div>
                  <input list="dlist" placeholder="Drug name + formulation" value={m.name}
                    onChange={e => upd(m.id, 'name', e.target.value)} />
                  <datalist id="dlist">{DRUGS.map(d => <option key={d} value={d} />)}</datalist>
                </div>
                <input placeholder="500mg" value={m.dose} onChange={e => upd(m.id, 'dose', e.target.value)} />
                <select value={m.freq} onChange={e => upd(m.id, 'freq', e.target.value)}>
                  {['OD','BD','TDS','QID','SOS','Weekly','HS','AC','PC'].map(x => <option key={x}>{x}</option>)}
                </select>
                <input placeholder="5 days" value={m.dur} onChange={e => upd(m.id, 'dur', e.target.value)} />
                <input placeholder="e.g. 15" type="number" value={m.qty} onChange={e => upd(m.id, 'qty', e.target.value)} style={{ maxWidth: 60 }} />
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--red)' }} onClick={() => del(m.id)}>
                  <Ic n="trash" s={14} />
                </button>
              </div>
            ))}

            {/* Printable Rx slip */}
            {saved && pt && (
              <div className="pcard" style={{ marginTop: 22 }}>
                <div className="phead">
                  <div>
                    <div className="phead-logo">RuralMed</div>
                    <div className="phead-sub">PHC Ramnagar, Dist. Varanasi, UP</div>
                  </div>
                  <div className="phead-info">
                    <div>Rx Date: {rxDate}</div>
                    <div>MO: Dr. Ananya Sharma</div>
                    <div>Reg: MCI/2019/UP/4521</div>
                  </div>
                </div>
                <div className="pbody">
                  <div className="fw8" style={{ fontSize: 15 }}>{pt.name} — {pt.age}y / {pt.gender}</div>
                  <div className="gr f12 mt8">{pt.id} — {pt.village}</div>
                  <div className="divider" />
                  <div className="fw8" style={{ fontSize: 14, marginBottom: 10 }}>Prescribed Medications</div>
                  {meds.filter(m => m.name).map((m, i) => (
                    <div key={m.id} style={{ padding: '9px 0', borderBottom: '1px dashed var(--divider)', display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--gray-lt)', minWidth: 22, fontWeight: 700 }}>{i + 1}.</span>
                      <div>
                        <div className="fw7">{m.name}{m.dose && ` — ${m.dose}`}</div>
                        <div className="gr f12">{[m.freq, m.dur, m.route].filter(Boolean).join(' — ')}</div>
                      </div>
                    </div>
                  ))}
                  {advice && <div className="mt12 f13"><span className="fw7">Advice: </span>{advice}</div>}
                  {fu      && <div className="mt8 f13"><span className="fw7">Follow-up: </span>{fu}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
