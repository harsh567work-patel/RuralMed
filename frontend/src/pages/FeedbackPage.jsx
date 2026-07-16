import { useState } from 'react';
import Ic from '../components/Icons';
import { feedback as feedbackAPI } from '../services/api';

const FEEDBACK_LOG = [
  { id: 'FB-012', type: 'Bug Report',       subject: 'Prescription PDF not generating offline',    status: 'In Review', date: '2026-02-28', priority: 'High'   },
  { id: 'FB-011', type: 'Feature Request',   subject: 'Add Hindi language support for vitals input', status: 'Planned',   date: '2026-02-25', priority: 'Medium' },
  { id: 'FB-010', type: 'General',           subject: 'Excellent tool — much faster than registers', status: 'Closed',    date: '2026-02-22', priority: 'Low'    },
];

const CATEGORIES = [
  'Patient Registration','Prescription Module','Referral Engine','Drug Inventory',
  'Reports / Dashboard','Offline Sync','Print / PDF','User Interface',
  'Performance / Speed','Data Security','Other',
];

const FEEDBACK_TYPES = [
  ['platform', 'Platform / App Feedback'],
  ['bug',      'Bug Report'],
  ['feature',  'Feature Request'],
  ['clinical', 'Clinical Workflow Suggestion'],
  ['training', 'Training Help'],
  ['other',    'Other'],
];

export default function FeedbackPage({ toast }) {
  const [tab,      setTab]      = useState('submit');
  const [type,     setType]     = useState('platform');
  const [rating,   setRating]   = useState(0);
  const [hover,    setHover]    = useState(0);
  const [category, setCategory] = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [priority, setPriority] = useState('medium');
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!subject || !message || !rating) { toast('Rating, subject and message are required.', 'error'); return; }
    
    try {
      setLoading(true);
      await feedbackAPI.submit({
        type,
        message: `${subject}\n\n${message}`,
        rating,
      });
      setDone(true);
      toast('Feedback submitted. Thank you for helping improve RuralMed.', 'success');
      setTimeout(() => { setSubject(''); setMessage(''); setRating(0); setDone(false); }, 4000);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const priorityBadge = p => p === 'High' ? 'bg-r' : p === 'Medium' ? 'bg-y' : 'bg-gr';
  const statusBadge   = s => s === 'Closed' ? 'bg-g' : s === 'Planned' ? 'bg-b' : 'bg-y';

  return (
    <div>
      <div className="ph">
        <div><h1>Feedback</h1><p>Report issues, suggest features or share your experience with RuralMed</p></div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'submit' ? ' active' : ''}`} onClick={() => setTab('submit')}>Submit Feedback</button>
        <button className={`tab-btn${tab === 'log'    ? ' active' : ''}`} onClick={() => setTab('log')}>My Feedback ({FEEDBACK_LOG.length})</button>
      </div>

      {/* ── SUBMIT ── */}
      {tab === 'submit' && (
        <div className="g2">
          <div>
            {done && (
              <div className="alert alert-success mb16">
                <Ic n="check" s={14} /> Feedback submitted. Our team will review within 48 hours.
              </div>
            )}

            {/* Type selector */}
            <div className="card mb22">
              <div className="card-title"><div className="ctbar" />Feedback Type</div>
              <div className="ftype-grid">
                {FEEDBACK_TYPES.map(([v, l]) => (
                  <div key={v} className={`ftype-opt${type === v ? ' sel' : ''}`} onClick={() => setType(v)}>{l}</div>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="card">
              <div className="card-title"><div className="ctbar" />Priority Level</div>
              <div className="rg mt8">
                {[['low','Low'],['medium','Medium'],['high','High'],['critical','Critical']].map(([v, l]) => (
                  <label key={v} className="ri">
                    <input type="radio" name="priority" value={v} checked={priority === v} onChange={e => setPriority(e.target.value)} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Star rating */}
            <div className="card mb22">
              <div className="card-title"><div className="ctbar" />Rate Your Experience</div>
              <div className="gr f13 mb8">How would you rate RuralMed overall?</div>
              <div className="star-row">
                {[1,2,3,4,5].map(s => (
                  <button key={s} className={`str${(hover || rating) >= s ? ' on' : ''}`}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}>
                    {(hover || rating) >= s ? '★' : '☆'}
                  </button>
                ))}
              </div>
              {rating > 0 && <div className="gr f13">{['','Poor','Below Average','Average','Good','Excellent'][rating]} — {rating}/5</div>}
            </div>

            {/* Details form */}
            <div className="card">
              <div className="card-title"><div className="ctbar" />Feedback Details</div>
              <div className="field">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Subject *</label>
                <input placeholder="Brief subject line for your feedback" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="field">
                <label>Detailed Message *</label>
                <textarea rows={5} placeholder="Describe the issue or suggestion in detail. Include steps to reproduce a bug if applicable..." value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div className="field">
                <label>How Urgent Is This?</label>
                <div className="rg mt8">
                  {[['Blocking my work','blocking'],['Inconvenient but manageable','inconvenient'],['Minor / Nice-to-have','minor']].map(([l, v]) => (
                    <label key={v} className="ri"><input type="radio" name="urg" value={v} />{l}</label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn btn-primary" onClick={submit}><Ic n="save" s={14} /> Submit Feedback</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG ── */}
      {tab === 'log' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>Subject</th><th>Priority</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {FEEDBACK_LOG.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '.4px' }}>{f.id}</td>
                    <td className="fw6">{f.type}</td>
                    <td>{f.subject}</td>
                    <td><span className={`badge ${priorityBadge(f.priority)}`}>{f.priority}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--gray)' }}>{f.date}</td>
                    <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
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
