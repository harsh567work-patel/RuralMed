import { useState, useEffect } from 'react';
import Ic from '../components/Icons';
import { FACS, TODAY_ISO } from '../data/mockData';
import { referrals as referralsAPI } from '../services/api';

const DEPTS = ['Medicine','Surgery','Obstetrics & Gynaecology','Paediatrics','Orthopaedics','ENT','Ophthalmology','Psychiatry','Cardiology'];

export default function ReferPage({ patients, toast }) {
  const [tab,       setTab]       = useState('new');
  const [selId,     setSelId]     = useState('');
  const [q,         setQ]         = useState('');
  const [urgency,   setUrgency]   = useState('routine');
  const [facility,  setFacility]  = useState('');
  const [dept,      setDept]      = useState('');
  const [reason,    setReason]    = useState('');
  const [hx,        setHx]        = useState('');
  const [transport, setTransport] = useState('patient_arrangement');
  const [notes,     setNotes]     = useState('');
  const [sent,      setSent]      = useState(false);
  const [log,       setLog]       = useState([]);
  const [loading,   setLoading]   = useState(false);

  const urgencyBadge = u => u === 'routine' ? 'bg-g' : u === 'urgent' ? 'bg-y' : 'bg-r';

  // Load referral history from API
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await referralsAPI.getAll(1, 50).catch(e => null);
        if (result?.data) {
          setLog(result.data.map(r => ({
            id: `REF-${r.id}`,
            patient: r.patientId,
            date: r.date,
            facility: r.facility,
            urgency: (r.urgency || 'routine').toLowerCase(),
            reason: r.reason,
            status: r.status || 'Sent'
          })));
        }
      } catch (err) {
        console.log('Could not load referral history:', err.message);
      }
    };
    loadHistory();
  }, []);

  const pt       = patients.find(p => p.id === selId);
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase())
  );

  const submit = async () => {
    if (!selId || !facility || !reason) { toast('Patient, Facility and Reason are required.', 'error'); return; }
    
    try {
      setLoading(true);
      // Combine clinical history and department into notes if provided
      let fullNotes = notes;
      if (dept) fullNotes = `Department: ${dept}\n${fullNotes}`;
      if (hx) fullNotes = `Clinical History: ${hx}\n${fullNotes}`;
      
      const result = await referralsAPI.create({
        patientId: selId,
        facility,
        reason,
        urgency,
        transport,
        notes: fullNotes,
        date: TODAY_ISO,
      });
      
      setSent(true);
      // Add to log
      setLog(l => [{
        id: `REF-${result.data?.id || Date.now()}`,
        patient: pt.name,
        date: TODAY_ISO,
        facility,
        urgency,
        status: 'Sent',
        reason
      }, ...l]);
      
      toast(`Referral sent to ${facility}.`, 'success');
      
      // Reset form
      setTimeout(() => {
        setSelId('');
        setFacility('');
        setDept('');
        setReason('');
        setHx('');
        setTransport('patient_arrangement');
        setNotes('');
        setSent(false);
      }, 2000);
    } catch (err) {
      toast(err.message || 'Failed to send referral', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div><h1>Refer Patient</h1><p>Generate referral notes and escalate patients to higher facilities</p></div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'new'     ? ' active' : ''}`} onClick={() => setTab('new')}>New Referral</button>
        <button className={`tab-btn${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>Referral History ({log.length})</button>
      </div>

      {/* ── NEW REFERRAL ── */}
      {tab === 'new' && (
        <div className="g2">
          <div>
            {/* Patient selector */}
            <div className="card mb22">
              <div className="card-title"><div className="ctbar" />Step 1: Select Patient</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Find and select the patient who needs to be referred</div>
              <div className="sb mb16" style={{ maxWidth: '100%' }}>
                <Ic n="search" s={15} />
                <input placeholder="Search patient..." value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <div className="ptlist">
                {filtered.map(p => (
                  <div key={p.id} className={`ptitem${selId === p.id ? ' sel' : ''}`}
                    onClick={() => { setSelId(p.id); setQ(p.name); }}>
                    <div>
                      <div className="pt-nm">{p.name}</div>
                      <div className="pt-mt">{p.id} — {p.diagnosis}</div>
                    </div>
                    {selId === p.id && <span style={{ color: 'var(--teal)' }}><Ic n="check" s={14} /></span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div className="card mb22">
              <div className="card-title"><div className="ctbar" />Step 2: Select Case Urgency</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Assess how urgently the patient needs referral</div>
              <div className="urow">
                {[['routine','Routine','Non-urgent, stable'],['urgent','Urgent','Needs attention within 24h'],['emergency','Emergency','Immediate transfer']].map(([v, l, s]) => (
                  <div key={v} className={`ubtn ${v}${urgency === v ? ' sel' : ''}`} onClick={() => setUrgency(v)}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 11, opacity: .75, fontWeight: 500 }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="card">
              <div className="card-title"><div className="ctbar" />Step 3: Referral Details</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12, fontWeight: 500 }}>Specify where and why the patient is being referred</div>
              <div className="field">
                <label>Referring To — Facility *</label>
                <select value={facility} onChange={e => setFacility(e.target.value)}>
                  <option value="">Select facility</option>
                  {FACS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Department / Speciality</label>
                <select value={dept} onChange={e => setDept(e.target.value)}>
                  <option value="">General / No Preference</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Reason for Referral *</label>
                <textarea placeholder="Clinical reason — diagnosis, specific investigation needed..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <div className="field">
                <label>Relevant Clinical History</label>
                <textarea rows={2} placeholder="Summarise relevant history, examinations, investigations done at PHC..." value={hx} onChange={e => setHx(e.target.value)} />
              </div>
              <div className="field">
                <label>Transport Arrangement</label>
                <div className="rg mt8">
                  {[['patient_arrangement','Patient Arrangement'],['ambulance_108','108 Ambulance'],['phc_vehicle','PHC Vehicle'],['private_vehicle','Private Vehicle']].map(([v, l]) => (
                    <label key={v} className="ri">
                      <input type="radio" name="transport" value={v} checked={transport === v} onChange={e => setTransport(e.target.value)} />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Additional Notes for Receiving Doctor</label>
                <textarea rows={2} placeholder="Any other important information..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost" disabled={loading}>Preview Note</button>
                <button
                  className={`btn ${urgency === 'emergency' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={submit}
                  disabled={loading}
                >
                  {loading
                    ? <><span style={{ marginRight: 6 }}>⏳</span>Sending…</>
                    : <><Ic n="refer" s={14} /> Send Referral</>}
                </button>
              </div>
            </div>
          </div>

          <div>
            {/* Printable referral note */}
            {sent && pt && (
              <div className="pcard mb22" style={{ border: '2px solid var(--teal)' }}>
                <div className="phead">
                  <div><div className="phead-logo">RuralMed — Referral Note</div><div className="phead-sub">PHC Ramnagar, Varanasi, UP</div></div>
                  <div className="phead-info"><div>{TODAY_ISO}</div></div>
                </div>
                <div className="pbody">
                  <div className="fb" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="fw8" style={{ fontSize: 16 }}>{pt.name}</div>
                      <div className="gr f12 mt8">{pt.id} — {pt.age}y / {pt.gender} — {pt.village}</div>
                    </div>
                    <span className={`badge ${urgencyBadge(urgency)}`}>{urgency.toUpperCase()}</span>
                  </div>
                  <div className="divider" />
                  <div className="f13 mb8"><strong>Referred to:</strong> {facility}{dept && ` — ${dept}`}</div>
                  <div className="f13 mb8"><strong>Reason:</strong> {reason}</div>
                  {hx && <div className="f13 mb8"><strong>History:</strong> {hx}</div>}
                  <div className="f13 mb8"><strong>Transport:</strong> {transport.replace(/_/g, ' ')}</div>
                  <div className="divider" />
                  <div className="gr" style={{ fontSize: 12 }}>Signed by: Dr. Ananya Sharma, MO — PHC Ramnagar</div>
                </div>
                <div style={{ padding: '12px 22px', background: 'var(--bg)', borderTop: '1px solid var(--divider)' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Ic n="print" s={12} /> Print Note</button>
                </div>
              </div>
            )}

            {/* Recent referrals mini-list */}
            <div className="card">
              <div className="card-title"><div className="ctbar" />Recent Referrals</div>
              {log.slice(0, 4).map(r => (
                <div key={r.id} style={{ padding: '13px 0', borderBottom: '1px solid var(--divider)' }}>
                  <div className="fb mb8">
                    <span className="fw7" style={{ fontSize: 14 }}>{r.patient}</span>
                    <span className={`badge ${urgencyBadge(r.urgency)}`}>{r.urgency}</span>
                  </div>
                  <div className="gr f13 mb8">{r.facility}</div>
                  <div className="f13 mb8">{r.reason}</div>
                  <div className="fb">
                    <span style={{ fontSize: 12, color: 'var(--gray-lt)', fontWeight: 600 }}>{r.date}</span>
                    <span className={`badge ${r.status === 'Acknowledged' ? 'bg-g' : 'bg-b'}`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TABLE ── */}
      {tab === 'history' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>Ref ID</th><th>Patient</th><th>Date</th><th>Referred To</th><th>Urgency</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {log.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '.4px' }}>{r.id}</td>
                    <td className="fw7">{r.patient}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray)' }}>{r.date}</td>
                    <td className="f13">{r.facility}</td>
                    <td><span className={`badge ${urgencyBadge(r.urgency)}`}>{r.urgency}</span></td>
                    <td style={{ maxWidth: 200, fontSize: 12.5, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                    <td><span className={`badge ${r.status === 'Acknowledged' ? 'bg-g' : 'bg-b'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
