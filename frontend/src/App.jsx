import { useState, useEffect } from 'react';
import './styles/global.css';

import Sidebar  from './components/Sidebar';
import Topbar   from './components/Topbar';
import Toasts   from './components/Toasts';

import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import HomePage         from './pages/HomePage';
import PatientPage      from './pages/PatientPage';
import PrescriptionPage from './pages/PrescriptionPage';
import AppointmentPage    from './pages/AppointmentPage';
import ReferPage        from './pages/ReferPage';
import FeedbackPage     from './pages/FeedbackPage';
import SummaryPage      from './pages/SummaryPage';
import NotFoundPage     from './pages/NotFoundPage';

import { auth as authAPI, setAuthSession, getStoredAuthSession, clearAuthSession } from './services/api';
import { usePatientsQuery } from './db/usePatientsQuery';

export default function App() {
  const [authPage,     setAuthPage]     = useState('login');
  const [user,         setUser]         = useState(null);
  const [page,         setPage]         = useState('home');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [darkMode,     setDarkMode]     = useState(false);
  const [toasts,       setToasts]       = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Reactive read from local SQLite — re-renders automatically when PowerSync syncs
  const { patients, isLoading: pageLoading } = usePatientsQuery();

  // Valid pages that can be navigated to
  const VALID_PAGES = ['home', 'patients', 'appointment', 'prescription', 'refer', 'feedback', 'summary'];

  // Load and verify user from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedAuth = getStoredAuthSession();
      if (storedAuth.token) {
        try {
          if (storedAuth.user) setUser(storedAuth.user);
          // Verify with backend
          const res = await authAPI.me();
          if (res?.user) {
            setUser(res.user);
            setAuthSession(storedAuth.token, res.user);
          }
        } catch (err) {
          console.warn('Stored session invalid or expired:', err.message);
          clearAuthSession();
          setUser(null);
          setAuthPage('login');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for unauthorized/expired session events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      clearAuthSession();
      setAuthPage('login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // patients are loaded reactively by usePatientsQuery — no useEffect needed

  // collapse sidebar by default on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  }, []);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // loadPatients() removed — usePatientsQuery() handles reactive data loading from local SQLite

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const go = (p) => {
    // Validate page exists
    if (!VALID_PAGES.includes(p)) {
      setPage('not-found');
      return;
    }
    setPage(p);
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthSession(token, userData);
  };

  const handleLogout = () => {
    setUser(null);
    clearAuthSession();
    setAuthPage('login');
  };

  // ── AUTH SCREENS ──────────────────────────────────────────
  if (!user) {
    return authPage === 'login'
      ? <LoginPage  onLogin={handleLogin} goSignup={() => setAuthPage('signup')} />
      : <SignupPage onSignup={handleLogin} goLogin={() => setAuthPage('login')}  />;
  }

  // ── APP SHELL ─────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* mobile overlay */}
      <div
        className={`overlay${sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 900 ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        page={page}
        go={go}
        open={sidebarOpen}
        user={user}
        logout={handleLogout}
      />

      <div style={{ flex: 1 }}>
        <Topbar
          page={page}
          open={sidebarOpen}
          toggle={() => setSidebarOpen(s => !s)}
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
        />

        <div className={`main-content${sidebarOpen ? '' : ' full'}`}>
          <div className="content-wrapper">
            {/* 404 Page */}
            {page === 'not-found' && <NotFoundPage go={go} />}
            
            {/* Valid pages */}
            {page === 'home'         && <HomePage         patients={patients} go={go} />}
            {page === 'patients'     && <PatientPage      patients={patients} toast={addToast} />}
            {page === 'appointment'  && <AppointmentPage  patients={patients} toast={addToast} />}
            {page === 'prescription' && <PrescriptionPage patients={patients} toast={addToast} />}
            {page === 'refer'        && <ReferPage        patients={patients} toast={addToast} />}
            {page === 'feedback'     && <FeedbackPage     toast={addToast} />}
            {page === 'summary'      && <SummaryPage      patients={patients} />}
          </div>
        </div>
      </div>

      <Toasts list={toasts} />
    </div>
  );
}
