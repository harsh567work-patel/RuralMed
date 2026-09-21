import { useState } from 'react';
import Ic from '../components/Icons';
import { DRUGS, TODAY_ISO } from '../data/mockData';
import { usePowerSync } from '@powersync/react';
import { insertPrescription } from '../db/patientMutations';

/* ── Quick-fill templates with full smart defaults ───────────────── */
const TEMPLATES = [
  { name: 'Paracetamol 500mg', dose: '500mg', freq: 'TDS', dur: '5 days', route: 'Oral' },
  { name: 'ORS Sachet',        dose: '1 sachet in 200ml water', freq: 'SOS', dur: '3 days', route: 'Oral' },
  { name: 'Amoxicillin 500mg', dose: '500mg', freq: 'TDS', dur: '5 days', route: 'Oral' },
  { name: 'Metformin 500mg',   dose: '500mg', freq: 'BD',  dur: 'Long term', route: 'Oral' },
  { name: 'Ibuprofen 400mg',   dose: '400mg', freq: 'BD',  dur: '5 days', route: 'Oral' },
  { name: 'Azithromycin 500mg',dose: '500mg', freq: 'OD',  dur: '3 days', route: 'Oral' },
  { name: 'Amlodipine 5mg',    dose: '5mg',   freq: 'OD',  dur: 'Long term', route: 'Oral' },
  { name: 'Omeprazole 20mg',   dose: '20mg',  freq: 'OD',  dur: '14 days', route: 'Oral' },
  { name: 'Cetirizine 10mg',   dose: '10mg',  freq: 'OD',  dur: '5 days', route: 'Oral' },
  { name: 'Iron + Folic Acid', dose: '1 tab', freq: 'OD',  dur: '3 months', route: 'Oral' },
];

const FREQS = ['OD','BD','TDS','QID','SOS','Weekly','Fortnightly','HS','AC','PC','PRN'];
const ROUTES = ['Oral','IV','IM','SC','Topical','Inhalation','Sublingual','Rectal'];
const DURATIONS = ['3 days','5 days','7 days','10 days','14 days','1 month','3 months','6 months','Long term'];

const newMed = (overrides = {}) => ({
  id: Date.now() + Math.random(),
  name: '', dose: '', freq: 'OD', dur: '5 days', route: 'Oral', qty: '',
  ...overrides,
});

export default function PrescriptionPage({ patients, toast }) {
  const db = usePowerSync();
  const [selId,   setSelId]   = useState('');
  const [q,       setQ]       = useState('');
  const [meds,    setMeds]    = useState([newMed()]);
  const [advice,  setAdvice]  = useState('');
  const [fu,      setFu]      = useState('');
  const [rxDate,  setRxDate]  = useState(TODAY_ISO);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  const pt       = patients.find(p => p.id === selId);
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase())
  );

  const addMed   = ()            => setMeds(m => [...m, newMed()]);
  const upd      = (id, k, v)    => setMeds(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));
  const delMed   = id            => setMeds(m => m.filter(x => x.id !== id));
  const addTpl   = (tpl)         => setMeds(m => [...m, newMed(tpl)]);

  /* Auto-fill duration shortcut: typing "3d" → "3 days" */
  const durBlur = (id, val) => {
    const m = val.match(/^(\d+)\s*d$/i);
    if (m) upd(id, 'dur', `${m[1]} days`);
    const w = val.match(/^(\d+)\s*w$/i);
    if (w) upd(id, 'dur', `${w[1]} weeks`);
    const mo = val.match(/^(\d+)\s*m$/i);
    if (mo) upd(id, 'dur', `${mo[1]} months`);
  };

  const savePx = async () => {
    if (!selId) { toast('Select a patient first.', 'error'); return; }
    const validMeds = meds.filter(m => m.name.trim());
    if (validMeds.length === 0) { toast('Add at least one medication.', 'error'); return; }

    try {
      setLoading(true);

      // Write each medication directly to local SQLite — works offline.
      // PowerSync automatically queues all inserts for background sync to PostgreSQL.
      for (const med of validMeds) {
        await insertPrescription(db, selId, med, {
          advice: advice,
          rxDate: rxDate,
          fu:     fu,
        });
      }

      setSaved(true);
      toast(`Prescription saved — ${validMeds.length} medication${validMeds.length > 1 ? 's' : ''}.`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to save prescription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMeds([newMed()]); setAdvice(''); setFu(''); setRxDate(TODAY_ISO);
    setSelId(''); setQ(''); setSaved(false);
  };

  const printRx = () => {
    const el = document.getElementById('rx-print-slip');
    if (!el) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>RuralMed Prescription</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #0D1B2A; background: #fff; }
    .pcard { border: 1.5px solid #D8E2EE; border-radius: 14px; overflow: hidden; max-width: 680px; margin: 24px auto; }
    .phead { background: #0A131C; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start; }
    .phead-logo { font-size: 18px; font-weight: 800; color: #fff; }
    .phead-sub { font-size: 11.5px; color: rgba(255,255,255,.5); margin-top: 2px; }
    .phead-info { text-align: right; font-size: 12px; color: rgba(255,255,255,.6); line-height: 1.7; }
    .pbody { padding: 18px 22px; }
    .fw7 { font-weight: 700; } .fw8 { font-weight: 800; }
    .gr { color: #6B7A8D; } .f12 { font-size: 12px; } .f13 { font-size: 13px; }
    .mt8 { margin-top: 8px; } .mt12 { margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #D8E2EE; margin: 14px 0; }
    .med-row { padding: 9px 0; border-bottom: 1px dashed #D8E2EE; display: flex; gap: 12px; }
    .med-num { font-size: 11px; color: #9AAAB8; min-width: 22px; font-weight: 700; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`;
    const w = window.open('', '_blank', 'width=780,height=900,scrollbars=yes');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Prescription</h1>
          <p>Write prescriptions — templates auto-fill common drug regimens</p>
        </div>
        <div className="ph-act">
          {saved && (
            <>
              <button className="btn btn-ghost" onClick={resetForm}>+ New Rx</button>
              <button className="btn btn-outline" onClick={printRx}>
                <Ic n="print" s={14} /> Print Rx
              </button>
            </>
          )}
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
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>
              Search and select the patient for whom you're writing this prescription
            </div>
            <div className="sb mb16" style={{ maxWidth: '100%' }}>
              <Ic n="search" s={15} />
              <input
                placeholder="Search patient by name or ID..."
                value={q}
                onChange={e => setQ(e.target.value)}
                autoFocus
              />
            </div>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-lt)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No patients registered yet</div>
                <div style={{ fontSize: 13 }}>Register a patient first, then come back to write a prescription.</div>
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
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>
              Date, follow-up, and physician advice
            </div>
            <div className="field-row">
              <div className="field"><label>Prescription Date</label><input type="date" value={rxDate} onChange={e => setRxDate(e.target.value)} /></div>
              <div className="field"><label>Follow-up Visit</label><input type="date" value={fu} onChange={e => setFu(e.target.value)} /></div>
            </div>
            <div className="field">
              <label>Doctor Advice</label>
              <textarea rows={2} placeholder="Rest, diet, hydration, activity restrictions…" value={advice} onChange={e => setAdvice(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <div className="card">
            <div className="card-title"><div className="ctbar" />Step 3: Add Medications ({meds.filter(m => m.name.trim()).length} filled)</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>
              Click a template to add it instantly, or type a drug name below. Only the drug name is required.
            </div>

            {/* Quick templates */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {TEMPLATES.map(t => (
                <button key={t.name} className="btn btn-ghost btn-sm"
                  style={{ border: '1.5px solid var(--divider)', borderRadius: '100px', fontSize: 12 }}
                  onClick={() => addTpl(t)}>
                  + {t.name}
                </button>
              ))}
            </div>

            <div className="divider" />

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '24px 1.8fr 0.8fr 0.8fr 0.8fr 48px 32px',
              gap: 6, padding: '0 4px 8px',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, color: 'var(--gray-lt)',
            }}>
              <span>#</span><span>Drug / Formulation</span><span>Dose</span>
              <span>Frequency</span><span>Duration</span><span>Qty</span><span></span>
            </div>

            {meds.map((m, i) => (
              <div key={m.id} style={{
                display: 'grid',
                gridTemplateColumns: '24px 1.8fr 0.8fr 0.8fr 0.8fr 48px 32px',
                gap: 6, alignItems: 'center',
                background: m.name.trim() ? 'var(--bg)' : 'var(--bg-white)',
                border: `1.5px solid ${m.name.trim() ? 'var(--teal)' : 'var(--divider)'}`,
                borderRadius: 'var(--r-md)', padding: '10px 12px', marginBottom: 8,
                transition: 'border-color .15s',
              }}>
                {/* # */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: m.name.trim() ? 'var(--teal)' : 'var(--divider)',
                  color: m.name.trim() ? '#000' : 'var(--gray)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0, transition: 'all .15s',
                }}>{i + 1}</div>

                {/* Drug name with datalist */}
                <div style={{ position: 'relative' }}>
                  <input
                    list={`dlist-${m.id}`}
                    placeholder="Drug name + formulation"
                    value={m.name}
                    onChange={e => upd(m.id, 'name', e.target.value)}
                    style={{
                      width: '100%', border: '1.5px solid var(--divider)', borderRadius: 8,
                      padding: '7px 10px', fontSize: 13, fontFamily: 'var(--font)',
                      background: 'var(--bg-white)', color: 'var(--navy)', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                    onBlur={e => e.target.style.borderColor = 'var(--divider)'}
                  />
                  <datalist id={`dlist-${m.id}`}>
                    {DRUGS.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>

                {/* Dose */}
                <input
                  placeholder="500mg"
                  value={m.dose}
                  onChange={e => upd(m.id, 'dose', e.target.value)}
                  style={{ border: '1.5px solid var(--divider)', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'var(--font)', background: 'var(--bg-white)', color: 'var(--navy)', outline: 'none', width: '100%' }}
                />

                {/* Frequency dropdown */}
                <select
                  value={m.freq}
                  onChange={e => upd(m.id, 'freq', e.target.value)}
                  style={{ border: '1.5px solid var(--divider)', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font)', background: 'var(--bg-white)', color: 'var(--navy)', outline: 'none', width: '100%', cursor: 'pointer' }}
                >
                  {FREQS.map(x => <option key={x}>{x}</option>)}
                </select>

                {/* Duration with smart parse + datalist */}
                <div>
                  <input
                    list={`dur-${m.id}`}
                    placeholder="5 days"
                    value={m.dur}
                    onChange={e => upd(m.id, 'dur', e.target.value)}
                    onBlur={e => durBlur(m.id, e.target.value)}
                    style={{ border: '1.5px solid var(--divider)', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'var(--font)', background: 'var(--bg-white)', color: 'var(--navy)', outline: 'none', width: '100%' }}
                  />
                  <datalist id={`dur-${m.id}`}>
                    {DURATIONS.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>

                {/* Qty — no spinner arrows */}
                <input
                  placeholder="Qty"
                  type="number"
                  min="0"
                  value={m.qty}
                  onChange={e => upd(m.id, 'qty', e.target.value)}
                  style={{
                    border: '1.5px solid var(--divider)', borderRadius: 8, padding: '7px 8px',
                    fontSize: 13, fontFamily: 'var(--font)', background: 'var(--bg-white)',
                    color: 'var(--navy)', outline: 'none', width: '100%',
                    MozAppearance: 'textfield',
                  }}
                  className="qty-input"
                />

                {/* Delete */}
                <button
                  onClick={() => delMed(m.id)}
                  title="Remove this medication"
                  style={{
                    background: 'none', border: '1.5px solid transparent', borderRadius: 8,
                    cursor: 'pointer', color: 'var(--gray-lt)', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s', width: 32, height: 32,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(232,64,64,.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--gray-lt)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <Ic n="trash" s={13} />
                </button>
              </div>
            ))}

            {/* Add drug button */}
            <button
              className="btn btn-ghost"
              onClick={addMed}
              style={{ width: '100%', justifyContent: 'center', border: '1.5px dashed var(--divider)', borderRadius: 'var(--r-md)', padding: '10px', marginTop: 4, color: 'var(--gray)', fontSize: 13 }}
            >
              <Ic n="plus" s={13} /> Add Another Drug
            </button>

            {/* Printable Rx slip */}
            {saved && pt && (
              <div id="rx-print-slip" className="pcard" style={{ marginTop: 22 }}>
                <div className="phead">
                  <div>
                    <div className="phead-logo">RuralMed</div>
                    <div className="phead-sub">PHC Ramnagar, Dist. Varanasi, UP</div>
                  </div>
                  <div className="phead-info">
                    <div>Rx Date: {rxDate}</div>
                    <div>MO: {pt.name}</div>
                    <div>Reg: MCI/2019/UP/4521</div>
                  </div>
                </div>
                <div className="pbody">
                  <div className="fw8" style={{ fontSize: 15 }}>{pt.name} — {pt.age}y / {pt.gender}</div>
                  <div className="gr f12 mt8">{pt.id} — {pt.village}</div>
                  <div className="divider" />
                  <div className="fw8" style={{ fontSize: 14, marginBottom: 10 }}>Prescribed Medications</div>
                  {meds.filter(m => m.name.trim()).map((m, i) => (
                    <div key={m.id} style={{ padding: '9px 0', borderBottom: '1px dashed var(--divider)', display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--gray-lt)', minWidth: 22, fontWeight: 700 }}>{i + 1}.</span>
                      <div>
                        <div className="fw7">{m.name}{m.dose && m.dose !== '—' ? ` — ${m.dose}` : ''}</div>
                        <div className="gr f12">{[m.freq, m.dur !== '—' ? m.dur : '', m.route].filter(Boolean).join(' · ')}</div>
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
