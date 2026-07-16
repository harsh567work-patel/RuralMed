import { useState, useEffect } from 'react';
import Ic from '../components/Icons';
import { stats, patients as patientsAPI, prescriptions as prescriptionsAPI, referrals as referralsAPI } from '../services/api';

const DIAGNOSES = [
  { l: 'Hypertension',           n: 38, p: 22 },
  { l: 'Respiratory Infection',  n: 31, p: 18 },
  { l: 'Diabetes Type 2',        n: 24, p: 14 },
  { l: 'Anaemia',                n: 20, p: 12 },
  { l: 'Malaria',                n: 15, p: 9  },
  { l: 'Tuberculosis',           n: 12, p: 7  },
  { l: 'Diarrhoea / GE',         n: 10, p: 6  },
  { l: 'Other',                  n: 21, p: 12 },
];

const TARGETS = [
  { l: 'OPD Patients',   c: 587, t: 800 },
  { l: 'Immunisations',  c: 142, t: 200 },
  { l: 'ANC Visits',     c: 48,  t: 60  },
  { l: 'TB DOTS',        c: 22,  t: 28  },
];

export default function SummaryPage({ patients }) {
  const [period, setPeriod] = useState('month');
  const [statsData, setStatsData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch comprehensive data from API
        const [summaryRes, dashboardRes, prescriptionsRes, referralsRes] = await Promise.all([
          stats.getSummary().catch(e => { console.error('Summary error:', e); return null; }),
          stats.getDashboard().catch(e => { console.error('Dashboard error:', e); return null; }),
          prescriptionsAPI.getAll(1, 10).catch(e => null),
          referralsAPI.getAll(1, 10).catch(e => null)
        ]);

        setStatsData(summaryRes?.data || {});
        setDashboardData(dashboardRes?.data || {});

        // Build activity timeline from recent prescriptions and referrals
        const activities = [];
        
        if (prescriptionsRes?.data) {
          prescriptionsRes.data.slice(0, 5).forEach(p => {
            activities.push({
              t: new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              a: 'Prescription',
              p: p.patientId,
              d: p.drug ? `${p.drug} — ${p.dosage || ''}` : 'Prescription issued',
              time: new Date(p.createdAt).getTime()
            });
          });
        }
        
        if (referralsRes?.data) {
          referralsRes.data.slice(0, 5).forEach(r => {
            activities.push({
              t: new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              a: 'Referral',
              p: r.patientId,
              d: r.reason ? `Referred to ${r.facility}` : 'Referral sent',
              time: new Date(r.createdAt).getTime()
            });
          });
        }

        // Sort by time and keep top 5
        const sortedActivities = activities.sort((a, b) => b.time - a.time).slice(0, 5);
        setRecentActivity(sortedActivities);

        // Extract top diagnoses from stats data if available
        if (summaryRes?.data?.topDiagnoses) {
          setTopDiagnoses(summaryRes.data.topDiagnoses);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats based on available data - real numbers from API
  const totalPatients = dashboardData?.patients || 0;
  const totalPrescriptions = dashboardData?.prescriptions || 0;
  const totalReferrals = dashboardData?.referrals || 0;
  const pendingReferrals = dashboardData?.pendingReferrals || 0;
  const activePatients = statsData?.activePatients || totalPatients;
  const referredPatients = statsData?.referredPatients || 0;
  
  // Statistics adjusted for time period selection
  const STATS = {
    today: {
      p: Math.max(0, Math.ceil((totalPatients / 30))),
      rx: Math.max(0, Math.ceil((totalPrescriptions / 30))),
      ref: Math.max(0, Math.ceil((totalReferrals / 30))),
      t: '4.2 min',
    },
    week: {
      p: Math.max(0, Math.ceil((totalPatients / 4))),
      rx: Math.max(0, Math.ceil((totalPrescriptions / 4))),
      ref: Math.max(0, Math.ceil((totalReferrals / 4))),
      t: '4.8 min',
    },
    month: {
      p: totalPatients,
      rx: totalPrescriptions,
      ref: totalReferrals,
      t: '4.5 min',
    },
  };
  const S = STATS[period];

  const actionBadge = a => a === 'Prescription' ? 'bg-g' : a === 'Referral' ? 'bg-y' : 'bg-b';

  if (loading) {
    return (
      <div>
        <div className="ph">
          <div><h1>Doctor Summary</h1><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="ph">
        <div><h1>Doctor Summary</h1><p>Daily, weekly and monthly performance overview</p></div>
        <div className="ph-act">
          {['today', 'week', 'month'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriod(p)}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
          <button className="btn btn-outline btn-sm"><Ic n="print" s={13} /> Export</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="sg">
        <div className="sc g"><div className="sc-lbl">Patients Seen</div><div className="sc-val">{S.p}</div><div className="sc-sub">{period === 'today' ? 'As of now' : `This ${period}`}</div></div>
        <div className="sc b"><div className="sc-lbl">Prescriptions</div><div className="sc-val">{S.rx}</div><div className="sc-sub">Issued</div></div>
        <div className="sc y"><div className="sc-lbl">Referrals Sent</div><div className="sc-val">{S.ref}</div><div className="sc-sub">To CHC / District Hospital</div></div>
        <div className="sc"  ><div className="sc-lbl">Avg Consult Time</div><div className="sc-val">{S.t}</div><div className="sc-sub">Per patient</div></div>
      </div>

      <div className="g2 mb22">
        {/* Disease burden table */}
        <div className="card">
          <div className="card-title"><div className="ctbar" />Disease Burden — Top Diagnoses</div>
          <div className="tw">
            <table>
              <thead><tr><th>#</th><th>Diagnosis</th><th>Count</th><th>% of OPD</th><th>Distribution</th></tr></thead>
              <tbody>
                {DIAGNOSES.map((d, i) => (
                  <tr key={d.l}>
                    <td className="gr f12 fw7">{i + 1}</td>
                    <td className="fw7">{d.l}</td>
                    <td style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.5px', color: 'var(--navy)' }}>{d.n}</td>
                    <td className="gr f13 fw6">{d.p}%</td>
                    <td style={{ width: 120 }}>
                      <div className="prog" style={{ marginTop: 0 }}>
                        <div className="pf" style={{ width: `${d.p * 4.5}%`, background: 'var(--teal)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {/* Demographic breakdown */}
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Demographic Breakdown</div>
            <div className="demo-grid">
              {[
                ['Total Registered',    totalPatients.toString()],
                ['Female Patients',     '58%'],
                ['Male Patients',       '41%'],
                ['Paediatric (< 12)',   '14%'],
                ['Senior (> 60)',       '22%'],
                ['First-time Visits',   '38%'],
              ].map(([l, v]) => (
                <div key={l} className="demo-cell">
                  <div className="demo-lbl">{l}</div>
                  <div className="demo-val">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly targets */}
          <div className="card">
            <div className="card-title"><div className="ctbar" />Monthly Targets</div>
            {TARGETS.map(x => {
              const pct = Math.round(x.c / x.t * 100);
              return (
                <div key={x.l} style={{ marginBottom: 16 }}>
                  <div className="fb mb8">
                    <span className="fw7 f13">{x.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>{x.c} / {x.t}</span>
                  </div>
                  <div className="prog">
                    <div className="pf" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--teal)' : pct > 50 ? 'var(--gold)' : 'var(--red)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity log */}
      <div className="card">
        <div className="card-title"><div className="ctbar" />Recent Clinical Activity Log</div>
        <div className="tw">
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>Patient</th><th>Details</th><th>Doctor</th></tr></thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>{r.t}</td>
                    <td><span className={`badge ${actionBadge(r.a)}`}>{r.a}</span></td>
                    <td className="fw7">{r.p}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray)' }}>{r.d}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray)' }}>Current User</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray)' }}>No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
