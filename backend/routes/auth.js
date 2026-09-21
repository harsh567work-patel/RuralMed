import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { run, get, all } from '../db/init.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';
import { logAuth, logError } from '../utils/logger.js';

// Get JWT_SECRET when needed (after dotenv.config() has run)
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return secret;
}

function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || (req.secure ? 'https' : 'http');
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}`;
}

function isStrongPassword(password) {
  // Enforce a minimum password strength so weak credentials are rejected early.
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function toUserPayload(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    facility: user.facility,
    role: user.role,
    provider: user.provider || 'local',
  };
}

const router = express.Router();
const csrfTokens = new Set();

function createCsrfToken() {
  // Generate a per-request CSRF token for state-changing auth calls.
  const token = crypto.randomBytes(24).toString('hex');
  csrfTokens.add(token);
  return token;
}

// Lightweight CSRF protection for state-changing requests.
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && (process.env.NODE_ENV === 'production' || process.env.ENFORCE_CSRF === 'true')) {
    const token = req.headers['x-csrf-token'];
    if (!token || !csrfTokens.has(token)) {
      return res.status(403).json({ error: 'CSRF token missing or invalid' });
    }
  }
  next();
});

router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: createCsrfToken() });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await get(`SELECT * FROM users WHERE id = ? AND isDeleted = 0`, [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: toUserPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password, email, name, facility, role } = req.body;

    if (!username || !password || !email || !name || !facility) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanFacility = String(facility).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, number, and a symbol' });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    try {
      const userRole = role && ['admin', 'doctor', 'health_worker'].includes(role) ? role : 'doctor';
      const result = await run(
        `INSERT INTO users (username, password, email, name, facility, role, provider) VALUES (?, ?, ?, ?, ?, ?, 'local')`,
        [cleanUsername, hashedPassword, cleanEmail, cleanName, cleanFacility, userRole]
      );

      const token = jwt.sign(
        { id: result.id, username: cleanUsername, email: cleanEmail, role: userRole },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      logAuth('Register', cleanUsername, true);

      res.status(201).json({
        token,
        user: { id: result.id, username: cleanUsername, email: cleanEmail, name: cleanName, facility: cleanFacility, role: userRole, provider: 'local' }
      });
    } catch (dbErr) {
      if (dbErr.message.includes('UNIQUE constraint failed')) {
        if (dbErr.message.includes('username')) {
          logAuth('Register', cleanUsername, false, 'Username exists');
          return res.status(409).json({ error: 'Username already exists' });
        }
        if (dbErr.message.includes('email')) {
          logAuth('Register', cleanUsername, false, 'Email exists');
          return res.status(409).json({ error: 'Email already registered' });
        }
      }
      throw dbErr;
    }
  } catch (err) {
    logError('Registration error', err, { username: req.body?.username });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logAuth('Login', username || 'unknown', false, 'Missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    const loginIdentifier = String(username).trim();
    const user = await get(`SELECT * FROM users WHERE (username = ? OR LOWER(email) = ?) AND isDeleted = 0`, [loginIdentifier, loginIdentifier.toLowerCase()]);

    if (!user) {
      logAuth('Login', loginIdentifier, false, 'User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcryptjs.compare(password, user.password);

    if (!isValid) {
      logAuth('Login', loginIdentifier, false, 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await run(`UPDATE users SET lastLoginAt = ? WHERE id = ?`, [new Date().toISOString(), user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    logAuth('Login', loginIdentifier, true);

    res.json({
      token,
      user: toUserPayload(user)
    });
  } catch (err) {
    logError('Login error', err, { username: req.body?.username });
    res.status(500).json({ error: err.message });
  }
});

router.post('/request-password-reset', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await get(`SELECT id, email FROM users WHERE LOWER(email) = ? AND isDeleted = 0`, [cleanEmail]);

    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      const hashedToken = await bcryptjs.hash(resetToken, 10);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await run(`UPDATE users SET passwordResetToken = ?, passwordResetExpiresAt = ? WHERE id = ?`, [hashedToken, expiresAt, user.id]);
      // In production, this should be wired to an email provider.
      console.info(`[AUTH] Password reset requested for ${user.email}`);
    }

    res.json({ message: 'If an account exists, a reset link has been sent to your email.' });
  } catch (err) {
    logError('Password reset request error', err, { email: req.body?.email });
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, number, and a symbol' });
    }

    const users = await all(`SELECT id, passwordResetToken, passwordResetExpiresAt FROM users WHERE passwordResetToken IS NOT NULL AND isDeleted = 0`, []);
    let matchingUser = null;

    for (const candidate of users) {
      const isMatch = candidate.passwordResetToken && await bcryptjs.compare(token, candidate.passwordResetToken);
      if (isMatch) {
        matchingUser = candidate;
        break;
      }
    }

    if (!matchingUser) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    const expiresAt = new Date(matchingUser.passwordResetExpiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    const newHashedPassword = await bcryptjs.hash(password, 12);
    await run(`UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetExpiresAt = NULL WHERE id = ?`, [newHashedPassword, matchingUser.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logError('Password reset error', err, { token: req.body?.token });
    res.status(500).json({ error: err.message });
  }
});

router.get('/google', async (req, res) => {
  try {
    // Google OAuth is exposed as a server-side redirect flow so the client never handles secrets directly.
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/google/callback`;

    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (err) {
    logError('Google OAuth URL error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/google/callback`;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('<html><body><h2>Google sign-in failed</h2><p>OAuth is not configured correctly.</p></body></html>');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Google token exchange failed');
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Google user info lookup failed');
    }

    const profile = await userInfoResponse.json();
    if (!profile.email) {
      throw new Error('Google account did not return an email address');
    }

    let user = await get(`SELECT * FROM users WHERE googleId = ? OR (LOWER(email) = ? AND isDeleted = 0)`, [profile.sub, profile.email.toLowerCase()]);

    if (!user) {
      const fallbackUsername = `google_${profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')}`;
      const tempPassword = crypto.randomBytes(24).toString('hex');
      const hashedPassword = await bcryptjs.hash(tempPassword, 12);
      const result = await run(
        `INSERT INTO users (username, password, email, name, facility, role, provider, googleId) VALUES (?, ?, ?, ?, ?, ?, 'google', ?)`,
        [fallbackUsername, hashedPassword, profile.email.toLowerCase(), profile.name || 'Google User', 'Google OAuth', 'doctor', profile.sub]
      );
      user = { id: result.id, username: fallbackUsername, email: profile.email.toLowerCase(), name: profile.name || 'Google User', facility: 'Google OAuth', role: 'doctor', provider: 'google' };
    } else if (!user.googleId) {
      await run(`UPDATE users SET googleId = ?, provider = 'google', lastLoginAt = ? WHERE id = ?`, [profile.sub, new Date().toISOString(), user.id]);
      user = { ...user, googleId: profile.sub, provider: 'google' };
    }

    await run(`UPDATE users SET lastLoginAt = ? WHERE id = ?`, [new Date().toISOString(), user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    const html = `<!doctype html>
      <html>
        <body style="font-family: Inter, Arial, sans-serif; background:#f4f8f7; color:#223; padding:24px;">
          <h3>Signing you in…</h3>
          <script>
            window.opener?.postMessage({ type: 'google-oauth-success', token: ${JSON.stringify(token)}, user: ${JSON.stringify(toUserPayload(user))} }, window.location.origin);
            window.close();
          </script>
        </body>
      </html>`;

    res.send(html);
  } catch (err) {
    logError('Google OAuth callback error', err, { code: req.query.code });
    res.status(500).send('<html><body><h2>Google sign-in failed</h2><p>Please try again later.</p></body></html>');
  }
});

/**
 * GET /api/auth/powersync-token
 *
 * Mints a short-lived JWT (1 hour) for the PowerSync Service to authenticate
 * the sync WebSocket connection. Called by src/db/connector.js fetchCredentials().
 *
 * Token payload follows PowerSync's required format:
 *   - sub  (string)  — unique user identifier (required by PowerSync)
 *   - iat / exp      — standard JWT claims (set automatically by jsonwebtoken)
 *   - role, facility — optional custom claims for PowerSync sync rules / row filtering
 *
 * Uses the same JWT_SECRET as all other tokens in this backend so no additional
 * secrets are needed. The `audience: 'powersync'` claim lets PowerSync rules
 * validate that a token was truly issued for sync (not reused from login).
 */
router.get('/powersync-token', authMiddleware, async (req, res) => {
  try {
    const powersyncToken = jwt.sign(
      {
        sub:      String(req.userId),  // PowerSync requires sub to be a string
        role:     req.user.role,       // Used in PowerSync sync rules for access control
        facility: req.user.facility,   // Used for facility-level row filtering (optional)
      },
      getJwtSecret(),
      {
        expiresIn: '1h',              // Short-lived — PowerSync calls fetchCredentials again before expiry
        audience:  'powersync',       // Prevents reuse of login tokens for sync
      }
    );

    // expiresAt lets connector.js schedule proactive token refresh
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    res.json({ token: powersyncToken, expiresAt });
  } catch (err) {
    logError('PowerSync token generation error', err, { userId: req.userId });
    res.status(500).json({ error: err.message });
  }
});

export default router;

