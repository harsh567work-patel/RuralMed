/**
 * Request logging middleware for RuralMed API
 * Logs all incoming requests with timing information
 */

import { logDebug } from '../utils/logger.js';

/**
 * Middleware to log API requests and response time
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  logDebug('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    logDebug('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Call original json function
    return originalJson.call(this, data);
  };

  next();
}
