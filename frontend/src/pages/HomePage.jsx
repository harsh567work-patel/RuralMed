import { useState, useEffect } from 'react';
import Ic from '../components/Icons';
import { TODAY_STR } from '../data/mockData';
import { stats as statsAPI, inventory as inventoryAPI } from '../services/api';

export default function HomePage({ patients, go }) {
  const [stats, setStats] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dashboard statistics
        const dashboardData = await statsAPI.getDashboard();
        setStats(dashboardData.data);

        // Load low stock inventory
        const inventoryData = await inventoryAPI.getLowStock();
        setStockItems(inventoryData.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        // Fall back to patient count if API fails
        setStats({
          patients: patients.length,
          prescriptions: 0,
          referrals: 0,
          pendingReferrals: 0,
          lowStockItems: 0,
          recentPatients: patients.slice(0, 5),
        });
        setStockItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patients]);

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Good Morning, Doctor</h1>
          <p>PHC Ramnagar — {TODAY_STR} — Daily overview</p>
        </div>
        <div className="ph-act">
          <button className="btn btn-outline" onClick={() => go('patients')}><Ic n="users" s={14} /> All Patients</button>
          <button className="btn btn-primary" onClick={() => go('patients')}><Ic n="plus" s={14} /> New Patient</button>
        </div>
      </div>

      <div className="sg">
        <div className="sc g"><div className="sc-lbl">Patients</div><div className="sc-val">{stats?.patients || 0}</div><div className="sc-sub">Total registered</div></div>
        <div className="sc b"><div className="sc-lbl">Prescriptions</div><div className="sc-val">{stats?.prescriptions || 0}</div><div className="sc-sub">Created</div></div>
        <div className="sc y"><div className="sc-lbl">Referrals</div><div className="sc-val">{stats?.referrals || 0}</div><div className="sc-sub">Total sent</div></div>
        <div className="sc r"><div className="sc-lbl">Low Stock Items</div><div className="sc-val">{stats?.lowStockItems || 0}</div><div className="sc-sub">Need refill</div></div>
      </div>

      <div className="g2">
        {/* Recent patients table */}
        <div className="card">
          <div className="card-title"><div className="ctbar" />Recent Patients</div>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-lt)' }}>Loading...</div>
          ) : stats?.recentPatients && stats.recentPatients.length > 0 ? (
            <>
              <div className="tw">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Name</th><th>Age/Sex</th><th>Village</th><th>Last Visit</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentPatients.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '.4px' }}>{p.id}</td>
                        <td className="fw7">{p.name}</td>
                        <td className="gr f13">{p.age}y</td>
                        <td className="f13">{p.village}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray)' }}>{p.lastVisit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => go('patients')}>View all patients</button>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-lt)' }}>No recent patients</div>
          )}
        </div>

        <div>
          {/* Drug stock */}
          <div className="card mb22">
            <div className="card-title"><div className="ctbar" />Drug Stock Alert</div>
            {stockItems.length > 0 ? (
              <>
                <div style={{ padding: '8px 0', marginBottom: 12, fontSize: 12, color: 'var(--gray)', fontWeight: 600 }}>
                  {stockItems.filter(d => Math.round(d.stock / d.minThreshold * 100) < 50).length} item(s) below optimal level
                </div>
                {stockItems.map((d, i) => {
                  const pct = Math.round(d.stock / d.minThreshold * 100);
                  const isLowStock = pct < 50;
                  const isCritical = pct < 25;
                  return (
                    <div key={i} style={{ marginBottom: 16, padding: '12px', background: isCritical ? 'rgba(239,68,68,0.08)' : isLowStock ? 'rgba(245,158,11,0.08)' : 'transparent', borderRadius: 4, border: isCritical ? '1px solid rgba(239,68,68,0.2)' : isLowStock ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--divider)' }}>
                      <div className="fb mb8">
                        <div>
                          <span className="fw7 f13">{d.name}</span>
                          {isCritical && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: 'var(--red)', background: 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: 3 }}>⚠ CRITICAL</span>}
                          {isLowStock && !isCritical && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: 'var(--warn)', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 3 }}>⚠ LOW</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isCritical ? 'var(--red)' : isLowStock ? 'var(--warn)' : 'var(--gray)' }}>{d.stock} left</span>
                      </div>
                      <div className="prog" style={{ background: 'var(--divider)', height: 6, borderRadius: 2, overflow: 'hidden' }}>
                        <div className="pf" style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: isCritical ? 'var(--red)' : isLowStock ? 'var(--gold)' : 'var(--teal)', transition: 'all 0.3s ease', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{pct}% of minimum threshold</span>
                        <span>Min: {d.minThreshold}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ padding: '12px', color: 'var(--gray-lt)', fontSize: 13 }}>✓ All items in stock</div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-title"><div className="ctbar" />Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { label: 'Register New Patient', id: 'patients',     icon: 'users' },
                { label: 'Write Prescription',   id: 'prescription', icon: 'rx'    },
                { label: 'Refer a Patient',      id: 'refer',        icon: 'refer' },
                { label: 'View Summary Report',  id: 'summary',      icon: 'grid'  },
              ].map(a => (
                <button key={a.id} className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => go(a.id)}>
                  <Ic n={a.icon} s={14} /> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
