import { useState, useEffect } from 'react';
import Ic from './Icons';
import { TODAY_STR, PAGE_TITLES } from '../data/mockData';

export default function Topbar({ page, open, toggle, darkMode, toggleTheme, lastSynced }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const syncLabel = lastSynced
    ? `Synced ${lastSynced}`
    : 'Not synced yet';

  return (
    <div className={`topbar${open ? '' : ' full'}`}>
      <button className="tb-toggle" onClick={toggle}>
        <Ic n="menu" s={20} />
      </button>
      <div className="tb-title">{PAGE_TITLES[page]}</div>
      <div className="tb-right">
        {/* Online / Offline indicator (§8.2) */}
        <div
          title={isOnline ? syncLabel : 'Working offline — changes will sync when connection is restored'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 100,
            marginRight: 8,
            background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: isOnline ? 'var(--teal)' : 'var(--red)',
            cursor: 'default',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isOnline ? 'var(--teal)' : 'var(--red)',
            display: 'inline-block',
            boxShadow: isOnline ? '0 0 0 2px rgba(16,185,129,0.3)' : '0 0 0 2px rgba(239,68,68,0.3)',
          }} />
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>

        <button className="tb-toggle" onClick={toggleTheme} style={{ marginRight: 8 }}>
          <Ic n={darkMode ? 'sun' : 'moon'} s={18} />
        </button>
        <div className="tb-pill">
          <div className="tb-dot" />
          PHC Ramnagar
        </div>
        <div className="tb-date">{TODAY_STR}</div>
      </div>
    </div>
  );
}
