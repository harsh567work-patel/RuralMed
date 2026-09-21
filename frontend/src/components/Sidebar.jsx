import Ic from './Icons';

export const NAV = [
  { id: 'home',         label: 'Dashboard',       icon: 'home'  },
  { id: 'patients',     label: 'Patient Records', icon: 'users' },
  { id: 'appointment',  label: 'Appointment',     icon: 'pulse' },
  { id: 'prescription', label: 'Prescription',    icon: 'rx'    },
  { id: 'refer',        label: 'Refer Patient',   icon: 'refer' },
  { id: 'feedback',     label: 'Feedback',        icon: 'msg'   },
  { id: 'summary',      label: 'Doctor Summary',  icon: 'grid'  },
];

function LogoIcon() {
  return (
    <div className="sb-logo-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  );
}

export default function Sidebar({ page, go, open, user, logout }) {
  return (
    <div className={`sidebar${open ? '' : ' collapsed'}`}>
      <div className="sb-logo">
        <LogoIcon />
        <span className="sb-logo-text">RuralMed</span>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Navigation</div>
        {NAV.map(n => (
          <div
            key={n.id}
            className={`nav-item${page === n.id ? ' active' : ''}`}
            onClick={() => go(n.id)}
          >
            <Ic n={n.icon} s={16} /> {n.label}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-av">{user.name?.[0] || 'D'}</div>
          <div>
            <div className="sb-name">{user.name}</div>
            <div className="sb-role">{user.role === 'doctor' ? 'Medical Officer' : user.role}</div>
          </div>
        </div>
        <button className="sb-logout" onClick={logout}>
          <Ic n="logout" s={13} /> Sign Out
        </button>
      </div>
    </div>
  );
}
