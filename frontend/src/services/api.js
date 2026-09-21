// API service for communicating with backend
// Use explicit VITE_API_BASE when provided, otherwise use relative paths to support ngrok and local proxying.
const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api');
const REQUEST_TIMEOUT = 10000; // 10 seconds
let csrfTokenPromise = null;

function getStoredItem(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredItem(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep the session alive in memory.
  }
}

function removeStoredItem(key) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

export function setAuthSession(token, user) {
  if (token) {
    setStoredItem('token', token);
  } else {
    removeStoredItem('token');
  }

  if (user) {
    setStoredItem('user', JSON.stringify(user));
  } else {
    removeStoredItem('user');
  }
}

export function getStoredAuthSession() {
  const token = getStoredItem('token');
  const userRaw = getStoredItem('user');
  let user = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      removeStoredItem('user');
    }
  }

  return { token, user };
}

export function clearAuthSession() {
  removeStoredItem('token');
  removeStoredItem('user');
}

async function ensureCsrfToken() {
  if (typeof window === 'undefined') return null;
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetch(`${API_BASE}/auth/csrf-token`, {
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      return data.csrfToken || null;
    })
    .catch(() => null);

  return csrfTokenPromise;
}

/**
 * Make API call with timeout and error handling
 */
export async function apiCall(method, endpoint, body = null, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    const fetchOptions = {
      method,
      headers,
      signal: controller.signal,
      credentials: 'include',
    };

    const token = getStoredItem('token');
    if (token) {
      fetchOptions.headers.Authorization = `Bearer ${token}`;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = await ensureCsrfToken();
      if (csrfToken) {
        fetchOptions.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ${method} ${url}`);

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorData = {};
      try {
        const rawText = await response.text();
        try {
          errorData = JSON.parse(rawText);
        } catch {
          errorData = { error: rawText || `HTTP ${response.status}` };
        }
      } catch (e) {
        errorData = { error: `HTTP ${response.status}` };
      }

      const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
      console.error(`[API ERROR] ${method} ${url} - ${errorMsg}`);

      // Handle 401 Unauthorized token errors automatically
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        console.warn(`[AUTH] Session expired or invalid token (${errorMsg}), clearing auth session.`);
        clearAuthSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: errorMsg } }));
        }
      }

      const err = new Error(errorMsg);
      err.status = response.status;
      err.errors = errorData.errors;
      throw err;
    }

    const data = await response.json();
    console.log(`[API SUCCESS] ${method} ${url}`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const msg = 'Request timeout - server not responding';
      console.error(`[API TIMEOUT]`, msg);
      throw new Error(msg);
    }
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
      const msg = `Cannot reach server at ${API_BASE}. Make sure backend is running on port 5000.`;
      console.error(`[API NETWORK ERROR]`, err.message);
      throw new Error(msg);
    }
    console.error(`[API ERROR]`, err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Auth
export const auth = {
  me: () => apiCall('GET', '/auth/me'),
  register: (data) => apiCall('POST', '/auth/register', data),
  login: (data) => apiCall('POST', '/auth/login', data),
  googleOAuth: () => apiCall('GET', '/auth/google'),
  requestPasswordReset: (email) => apiCall('POST', '/auth/request-password-reset', { email }),
  resetPassword: (data) => apiCall('POST', '/auth/reset-password', data),
  getPowerSyncToken: () => apiCall('GET', '/auth/powersync-token'), // Used by PowerSync connector
};

// Patients
export const patients = {
  getAll: (page = 1, limit = 50) => apiCall('GET', `/patients?page=${page}&limit=${limit}`),
  getById: (id) => apiCall('GET', `/patients/${id}`),
  create: (data) => apiCall('POST', '/patients', data),
  update: (id, data) => apiCall('PUT', `/patients/${id}`, data),
  delete: (id) => apiCall('DELETE', `/patients/${id}`),
};

// Prescriptions
export const prescriptions = {
  getAll: (page = 1, limit = 50) => apiCall('GET', `/prescriptions?page=${page}&limit=${limit}`),
  getById: (id) => apiCall('GET', `/prescriptions/${id}`),
  getByPatient: (patientId) => apiCall('GET', `/prescriptions/patient/${patientId}`),
  create: (data) => apiCall('POST', '/prescriptions', data),
  update: (id, data) => apiCall('PUT', `/prescriptions/${id}`, data),
  delete: (id) => apiCall('DELETE', `/prescriptions/${id}`),
};

// Referrals
export const referrals = {
  getAll: (page = 1, limit = 50) => apiCall('GET', `/referrals?page=${page}&limit=${limit}`),
  getById: (id) => apiCall('GET', `/referrals/${id}`),
  create: (data) => apiCall('POST', '/referrals', data),
  update: (id, data) => apiCall('PUT', `/referrals/${id}`, data),
  delete: (id) => apiCall('DELETE', `/referrals/${id}`),
};

// Feedback
export const feedback = {
  getAll: (page = 1, limit = 50) => apiCall('GET', `/feedback?page=${page}&limit=${limit}`),
  getById: (id) => apiCall('GET', `/feedback/${id}`),
  submit: (data) => apiCall('POST', '/feedback', data),
  update: (id, data) => apiCall('PUT', `/feedback/${id}`, data),
  delete: (id) => apiCall('DELETE', `/feedback/${id}`),
};

// Inventory
export const inventory = {
  getAll: (page = 1, limit = 50) => apiCall('GET', `/inventory?page=${page}&limit=${limit}`),
  getById: (id) => apiCall('GET', `/inventory/${id}`),
  getLowStock: () => apiCall('GET', '/inventory/low-stock'),
  create: (data) => apiCall('POST', '/inventory', data),
  update: (id, data) => apiCall('PUT', `/inventory/${id}`, data),
  delete: (id) => apiCall('DELETE', `/inventory/${id}`),
};

// Statistics/Dashboard
export const stats = {
  getDashboard: () => apiCall('GET', '/stats/dashboard'),
  getSummary: () => apiCall('GET', '/stats/summary'),
  getInventory: () => apiCall('GET', '/stats/inventory'),
};

// ============================================
// OFFLINE-AWARE API WRAPPERS
// ============================================

/**
 * Safe API call that handles offline gracefully
 * Returns null on network error instead of throwing
 * @param {Function} apiFn - API function to call
 * @param {string} label - Debug label
 * @returns {Promise} API response or null on failure
 */
export async function safeSyncCall(apiFn, label = 'API call') {
  try {
    console.log(`[SafeAPI] Attempting: ${label}`);
    const result = await apiFn();
    console.log(`[SafeAPI] Success: ${label}`);
    return result;
  } catch (error) {
    console.error(`[SafeAPI] Failed: ${label} - ${error.message}`);

    // Check if it's a network error
    if (
      error.message.includes('Cannot reach server') ||
      error.message.includes('timeout') ||
      error instanceof TypeError
    ) {
      console.log('[SafeAPI] Network error - will retry on sync');
      return null;
    }

    // Re-throw validation or auth errors
    throw error;
  }
}

/**
 * Get online status
 * @returns {boolean} True if navigator says online
 */
export function isOnline() {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online on server
}

/**
 * Check backend connectivity
 * @returns {Promise<boolean>} True if backend is reachable
 */
export async function checkConnectivity() {
  try {
    // Try a simple API call with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('[API] Backend not reachable:', error.message);
    return false;
  }
}

/**
 * Batch sync - send multiple records in one call
 * Used by sync service to reduce network overhead
 * @param {Array<Object>} patients - Patient records
 * @returns {Promise<Object>} Sync result
 */
export async function batchSyncPatients(patients) {
  if (!patients || patients.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const syncData = patients.map((patient) => ({
    uuid: patient.uuid,
    operation: patient.deletedAt ? 'delete' : patient.id ? 'update' : 'create',
    data: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      village: patient.village,
      phone: patient.phone,
      diagnosis: patient.diagnosis,
      weight: patient.weight,
      bpSystolic: patient.bpSystolic,
      bpDiastolic: patient.bpDiastolic,
      temperature: patient.temperature,
      notes: patient.notes,
      updatedAt: patient.updatedAt,
    },
  }));

  return apiCall('POST', '/patients/batch-sync', { records: syncData });
}

export default {
  // Core
  apiCall,
  safeSyncCall,
  isOnline,
  checkConnectivity,
  batchSync: batchSyncPatients,

  // Modules
  auth,
  patients,
  prescriptions,
  referrals,
  feedback,
  inventory,
  stats,
};
