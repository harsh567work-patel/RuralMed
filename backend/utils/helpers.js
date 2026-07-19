/**
 * Helper utilities for RuralMed API
 */

/**
 * Generate system patient ID in format RM-XXXXXX
 * Should be called by backend, not frontend
 */
export function generatePatientId(patientCount) {
  const paddedNum = String(patientCount + 1).padStart(6, '0');
  return `RM-${paddedNum}`;
}

/**
 * API Error class for consistent error responses
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Success response formatter
 */
export function successResponse(data = null, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Error response formatter
 */
export function errorResponse(message, errors = []) {
  return {
    success: false,
    message,
    errors,
  };
}

/**
 * Format timestamp for database
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Parse pagination parameters
 */
export function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50)); // Max 100 per page

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse(items, total, page, limit) {
  return {
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
