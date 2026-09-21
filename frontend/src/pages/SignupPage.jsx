import { useEffect, useState } from 'react';
import Ic from '../components/Icons';
import { auth } from '../services/api';

export default function SignupPage({ onSignup, goLogin }) {
  const [f, sf] = useState({ username: '', name: '', email: '', facility: '', role: 'doctor', pw: '', confirm: '' });
  const [err, se] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  useEffect(() => {
    const handleMessage = (event) => {
      const payload = event.data || {};
      if (payload.type === 'google-oauth-success') {
        onSignup(payload.user, payload.token);
      }
      if (payload.type === 'google-oauth-error') {
        se(payload.message || 'Google sign-in failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSignup]);

  const set = k => e => sf(p => ({ ...p, [k]: e.target.value }));

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    sf(p => ({ ...p, pw: value }));
    setPwStrength(getPasswordStrength(value));
  };

  const go = async () => {
    se('');
    setNotice('');

    if (!f.username || !f.name || !f.email || !f.facility || !f.pw) {
      se('All fields are required.');
      return;
    }

    if (f.username.length < 3) {
      se('Username must be at least 3 characters.');
      return;
    }

    if (!f.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      se('Please enter a valid email address.');
      return;
    }

    if (f.pw.length < 8 || !/[A-Z]/.test(f.pw) || !/[0-9]/.test(f.pw) || /[^A-Za-z0-9]/.test(f.pw) === false) {
      se('Password must be at least 8 characters and include uppercase, number, and a symbol.');
      return;
    }

    if (f.pw !== f.confirm) {
      se('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await auth.register({
        username: f.username,
        password: f.pw,
        email: f.email,
        name: f.name,
        facility: f.facility,
        role: f.role
      });
      onSignup(res.user, res.token);
    } catch (err) {
      const errorMsg = err?.message || 'Failed to create account. Please try again.';
      console.error('[SIGNUP ERROR]', errorMsg);

      if (errorMsg.includes('Email exists')) {
        se('This email is already registered. Please sign in instead.');
      } else if (errorMsg.includes('Username exists')) {
        se('This username is already taken. Please choose another.');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      go();
    }
  };

  const strengthLabel = pwStrength < 2 ? 'Weak' : pwStrength < 4 ? 'Medium' : 'Strong';
  const strengthColor = pwStrength < 2 ? '#e74c3c' : pwStrength < 4 ? '#f39c12' : '#27ae60';

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <div className="ap-logo">
          <div className="ap-logo-icon"><Ic n="pulse" s={20} /></div>
          <span className="ap-logo-text">RuralMed</span>
        </div>
        <div className="ap-title">Join India's Rural Healthcare Network</div>
        <p className="ap-desc">
          Register your PHC and start digitising patient records, prescriptions,
          and referrals — works offline on any Android device.
        </p>
        <div style={{ marginTop: 36 }}>
          <div className="sl" style={{ color: 'rgba(255,255,255,.3)', marginBottom: 18 }}>Why RuralMed</div>
          {[
            'Offline-first — works on 2G and zero connectivity',
            'Reduces documentation burden by up to 40%',
            'Free starter tier for NGOs and Pilot PHCs',
            'ABDM and DPDP Act 2023 compliant',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, color: 'rgba(255,255,255,.7)', fontSize: 13.5, fontWeight: 500 }}>
              <span style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }}><Ic n="check" s={14} /></span>{t}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <div className="auth-box-title">Create Account</div>
          <div className="auth-box-sub">Register yourself and your PHC to get started</div>

          {err && <div className="alert alert-danger">{err}</div>}
          {notice && <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(39,174,96,.12)', color: '#2e7d32', fontSize: 12.5, marginBottom: 10 }}>{notice}</div>}

          <div className="field-row">
            <div className="field"><label>Username</label><input placeholder="your.username" value={f.username} onChange={set('username')} onKeyPress={handleKeyPress} disabled={loading} autoFocus /></div>
            <div className="field"><label>Full Name</label><input placeholder="Dr. Full Name" value={f.name} onChange={set('name')} onKeyPress={handleKeyPress} disabled={loading} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Email</label><input type="email" placeholder="email@phc.gov.in" value={f.email} onChange={set('email')} onKeyPress={handleKeyPress} disabled={loading} /></div>
            <div className="field"><label>PHC Name</label><input placeholder="Primary Health Centre" value={f.facility} onChange={set('facility')} onKeyPress={handleKeyPress} disabled={loading} /></div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Role</label>
              <select value={f.role} onChange={set('role')} disabled={loading}>
                <option value="doctor">Medical Officer (Doctor)</option>
                <option value="health_worker">Health Worker (ANM/ASHA)</option>
                <option value="admin">Administrator / Block Officer</option>
              </select>
            </div>
            <div className="field"></div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Create password" value={f.pw} onChange={handlePasswordChange} onKeyPress={handleKeyPress} disabled={loading} />
              {f.pw && (
                <div style={{ fontSize: 11, marginTop: 6, color: strengthColor }}>
                  <div style={{ height: 6, borderRadius: 999, background: '#e9ecef', overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ width: `${Math.min(100, (pwStrength / 5) * 100)}%`, height: '100%', background: strengthColor, transition: 'width 0.2s ease' }} />
                  </div>
                  Strength: {strengthLabel}
                </div>
              )}
            </div>
            <div className="field"><label>Confirm Password</label><input type="password" placeholder="Repeat password" value={f.confirm} onChange={set('confirm')} onKeyPress={handleKeyPress} disabled={loading} /></div>
          </div>

          <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={go} disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
          <button className="btn btn-full" style={{ marginTop: 10, background: 'white', color: '#1f2937', border: '1px solid rgba(0,0,0,.08)', fontWeight: 700 }} onClick={handleGoogleSignIn} disabled={loading}>
            {loading ? 'Preparing...' : 'Continue with Google'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--gray)', fontWeight: 500 }}>
            Already registered?{' '}
            <span style={{ color: 'var(--teal)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: loading ? 0.5 : 1 }} onClick={() => !loading && goLogin()}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}
