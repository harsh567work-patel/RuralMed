import { useEffect, useState } from 'react';
import Ic from '../components/Icons';
import { auth } from '../services/api';

export default function LoginPage({ onLogin, goSignup }) {
  const [f, sf] = useState({ username: '', pw: '' });
  const [err, se] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      const payload = event.data || {};
      if (payload.type === 'google-oauth-success') {
        onLogin(payload.user, payload.token);
      }
      if (payload.type === 'google-oauth-error') {
        se(payload.message || 'Google sign-in failed. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const go = async () => {
    se('');
    setNotice('');

    if (!f.username || !f.pw) {
      se('Please enter both username and password.');
      return;
    }

    if (f.username.length < 3) {
      se('Username must be at least 3 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await auth.login({ username: f.username, password: f.pw });
      onLogin(res.user, res.token);
    } catch (error) {
      const errorMsg = error?.message || 'Failed to sign in. Please try again.';
      console.error('[LOGIN ERROR]', errorMsg);

      if (errorMsg.includes('User not found')) {
        se('Username not found. Please check and try again.');
      } else if (errorMsg.includes('incorrect')) {
        se('Incorrect password. Please try again.');
      } else if (errorMsg.includes('Cannot reach')) {
        se('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        se(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    se('');
    setNotice('');
    try {
      setLoading(true);
      const { authUrl } = await auth.googleOAuth();
      const popup = window.open(authUrl, 'googleOAuth', 'width=560,height=700,scrollbars=yes');
      if (!popup) {
        se('Please allow popups to continue with Google sign-in.');
      }
    } catch (error) {
      se(error?.message || 'Google sign-in could not be started.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = window.prompt('Enter the email address linked to your RuralMed account');
    if (!email) return;

    try {
      setResetLoading(true);
      await auth.requestPasswordReset(email);
      setNotice('If an account exists, a secure reset link has been sent to your email.');
    } catch (error) {
      se(error?.message || 'Password reset could not be started.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      go();
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <div className="ap-logo">
          <div className="ap-logo-icon"><Ic n="pulse" s={20} /></div>
          <span className="ap-logo-text">RuralMed</span>
        </div>
        <div className="ap-title">Digitising Rural Healthcare — One PHC at a Time</div>
        <p className="ap-desc">
          Offline-first clinical workflow platform for Primary Health Centres across India.
          Works on 2G. No internet required for core features.
        </p>
        <div className="ap-stats">
          <div className="ap-stat"><div className="ap-stat-val">160K+</div><div className="ap-stat-lbl">PHCs Nationwide</div></div>
          <div className="ap-stat"><div className="ap-stat-val">40%</div><div className="ap-stat-lbl">Documentation Reduction</div></div>
          <div className="ap-stat"><div className="ap-stat-val">2G</div><div className="ap-stat-lbl">Minimum Connectivity</div></div>
          <div className="ap-stat"><div className="ap-stat-val">ABDM</div><div className="ap-stat-lbl">Compliant Platform</div></div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <div className="auth-box-title">Sign in to RuralMed</div>
          <div className="auth-box-sub">Enter your credentials to access the clinical dashboard</div>

          {err && <div className="alert alert-danger">{err}</div>}
          {notice && <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(39,174,96,.12)', color: '#2e7d32', fontSize: 12.5, marginBottom: 10 }}>{notice}</div>}

          <div className="field">
            <label>Username</label>
            <input type="text" placeholder="your.username" value={f.username}
              onChange={e => sf(p => ({ ...p, username: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoFocus />
          </div>
          <div className="field" style={{ display: 'none' }}>
            <label>Role</label>
            <select value="doctor" onChange={e => {}}>
              <option value="doctor">Medical Officer / Doctor</option>
              <option value="asha">ASHA / ANM Worker</option>
              <option value="admin">PHC Administrator</option>
              <option value="block">Block Officer</option>
            </select>
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={f.pw}
              onChange={e => sf(p => ({ ...p, pw: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={loading} />
          </div>

          <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={go} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button 
            type="button"
            className="btn btn-full" 
            style={{ marginTop: 10, background: 'rgba(13, 148, 136, 0.08)', color: 'var(--teal)', border: '1px solid rgba(13, 148, 136, 0.25)', fontWeight: 600 }} 
            onClick={() => {
              sf({ username: 'demo_doctor', pw: 'demo123' });
              setLoading(true);
              auth.login({ username: 'demo_doctor', password: 'demo123' })
                .then(res => onLogin(res.user, res.token))
                .catch(err => se(err.message || 'Demo login failed'))
                .finally(() => setLoading(false));
            }} 
            disabled={loading}
          >
            ⚡ One-Click Demo Doctor Login (Dr. Ananya Sharma)
          </button>

          <button className="btn btn-full" style={{ marginTop: 10, background: 'white', color: '#1f2937', border: '1px solid rgba(0,0,0,.08)', fontWeight: 700 }} onClick={handleGoogleSignIn} disabled={loading}>
            {loading ? 'Preparing...' : 'Sign in with Google'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12.5, color: 'var(--gray)', fontWeight: 600 }}>
            <span style={{ color: 'var(--teal)', cursor: resetLoading ? 'not-allowed' : 'pointer', opacity: resetLoading ? 0.6 : 1 }} onClick={() => !resetLoading && handlePasswordReset()}>
              {resetLoading ? 'Sending reset...' : 'Forgot password?'}
            </span>
          </p>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--gray)', fontWeight: 500 }}>
            New to RuralMed?{' '}
            <span style={{ color: 'var(--teal)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: loading ? 0.5 : 1 }} onClick={() => !loading && goSignup()}>
              Create Account
            </span>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--gray-lt)' }}>
            Pilot access is free for NGOs and Government PHCs
          </p>
        </div>
      </div>
    </div>
  );
}
