/**
 * Structured logging utility for RuralMed API
 * Provides consistent log formatting across the application
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format timestamp as ISO string
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message with context
 */
function formatLog(level, message, context = {}) {
  return {
    timestamp: getTimestamp(),
    level,
    message,
    ...context,
    ...(process.env.NODE_ENV === 'production' && { env: 'production' }),
  };
}

/**
 * Log error with full context
 */
export function logError(message, error = null, context = {}) {
  const log = formatLog(LOG_LEVELS.ERROR, message, {
    error: error?.message || error,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    ...context,
  });
  console.error(JSON.stringify(log));
}

/**
 * Log warning
 */
export function logWarn(message, context = {}) {
  const log = formatLog(LOG_LEVELS.WARN, message, context);
  console.warn(JSON.stringify(log));
}

/**
 * Log info message
 */
export function logInfo(message, context = {}) {
  const log = formatLog(LOG_LEVELS.INFO, message, context);
  console.log(JSON.stringify(log));
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message, context = {}) {
  if (process.env.NODE_ENV === 'development') {
    const log = formatLog(LOG_LEVELS.DEBUG, message, context);
    console.debug(JSON.stringify(log));
  }
}

/**
 * Log API request
 */
export function logRequest(req) {
  logDebug('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId || 'anonymous',
  });
}

/**
 * Log API response
 */
export function logResponse(req, statusCode, message = 'Success') {
  logDebug('API Response', {
    method: req.method,
    path: req.path,
    statusCode,
    message,
    userId: req.userId || 'anonymous',
  });
}

/**
 * Log database operation
 */
export function logDbOperation(operation, table, userId = null, changes = null) {
  logDebug(`Database ${operation}`, {
    table,
    userId,
    changes: changes && process.env.NODE_ENV === 'development' ? changes : undefined,
  });
}

/**
 * Log authentication event
 */
export function logAuth(event, username, success = true, reason = null) {
  const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
  const log = formatLog(level, `Auth ${event}`, {
    username,
    success,
    reason: reason && !success ? reason : undefined,
  });
  console.log(JSON.stringify(log));
}
