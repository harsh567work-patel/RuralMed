import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { run, get } from '../db/init.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logAuth, logError } from '../utils/logger.js';

// Get JWT_SECRET when needed (after dotenv.config() has run)
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return secret;
}

const router = express.Router();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password, email, name, facility, role } = req.body;
    
    if (!username || !password || !email || !name || !facility) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    try {
      const userRole = role && ['admin', 'doctor', 'health_worker'].includes(role) ? role : 'doctor';
      const result = await run(
        `INSERT INTO users (username, password, email, name, facility, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, email, name, facility, userRole]
      );

      const token = jwt.sign(
        { id: result.id, username, email, role: userRole },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      logAuth('Register', username, true);

      res.status(201).json({
        token,
        user: { id: result.id, username, email, name, facility, role: userRole }
      });
    } catch (dbErr) {
      if (dbErr.message.includes('UNIQUE constraint failed')) {
        if (dbErr.message.includes('username')) {
          logAuth('Register', username, false, 'Username exists');
          return res.status(409).json({ error: 'Username already exists' });
        }
        if (dbErr.message.includes('email')) {
          logAuth('Register', username, false, 'Email exists');
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

    const user = await get(`SELECT * FROM users WHERE username = ? AND isDeleted = 0`, [username]);

    if (!user) {
      logAuth('Login', username, false, 'User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcryptjs.compare(password, user.password);

    if (!isValid) {
      logAuth('Login', username, false, 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    logAuth('Login', username, true);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        facility: user.facility,
        role: user.role
      }
    });
  } catch (err) {
    logError('Login error', err, { username: req.body?.username });
    res.status(500).json({ error: err.message });
  }
});

export default router;
