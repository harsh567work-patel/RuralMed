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
import ReferPage        from './pages/ReferPage';
import FeedbackPage     from './pages/FeedbackPage';
import SummaryPage      from './pages/SummaryPage';
import NotFoundPage     from './pages/NotFoundPage';

import { patients as patientsAPI } from './services/api';

export default function App() {
  const [authPage,     setAuthPage]     = useState('login');
  const [user,         setUser]         = useState(null);
  const [page,         setPage]         = useState('home');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [darkMode,     setDarkMode]     = useState(false);
  const [patients,     setPatients]     = useState([]);
  const [toasts,       setToasts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [lastSynced,   setLastSynced]   = useState(null);

  // Valid pages that can be navigated to
  const VALID_PAGES = ['home', 'patients', 'prescription', 'refer', 'feedback', 'summary'];

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        if (userData) setUser(userData);
      } catch (err) {
        // localStorage corrupted, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.error('Failed to parse user from localStorage:', err);
      }
    }
    setLoading(false);
  }, []);

  // Load patients when user is authenticated
  useEffect(() => {
    if (user && patients.length === 0) {
      loadPatients();
    }
  }, [user, patients.length]);

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

  const loadPatients = async () => {
    try {
      setPageLoading(true);
      // Fetch first page with 100 limit (can be adjusted)
      const data = await patientsAPI.getAll(1, 100);
      // Handle both paginated and simple array responses
      const patientsList = data.data || data;
      setPatients(Array.isArray(patientsList) ? patientsList : []);
      // Update last-synced timestamp on success
      const now = new Date();
      setLastSynced(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
    } catch (err) {
      console.error('Failed to load patients:', err);
      addToast('Failed to load patients', 'error');
      setPatients([]);
    } finally {
      setPageLoading(false);
    }
  };

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

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setPatients([]);
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
          lastSynced={lastSynced}
        />

        <div className={`main-content${sidebarOpen ? '' : ' full'}`}>
          <div className="content-wrapper">
            {/* 404 Page */}
            {page === 'not-found' && <NotFoundPage go={go} />}
            
            {/* Valid pages */}
            {page === 'home'         && <HomePage         patients={patients} go={go} />}
            {page === 'patients'     && <PatientPage      patients={patients} setPatients={setPatients} toast={addToast} />}
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
