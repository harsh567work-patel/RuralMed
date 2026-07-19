import jwt from 'jsonwebtoken';

// Get JWT_SECRET when needed (after dotenv.config() has run)
function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  
  // Warn if using default in production
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production. Set JWT_SECRET environment variable.');
  }
  
  return secret;
}

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Role-Based Access Control Middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'User role information missing' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
