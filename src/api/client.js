/**
 * Angel Fly Cockpit — API Client
 * Drop-in replacement for @base44/sdk
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('af_token');
}

export function setToken(token) {
  localStorage.setItem('af_token', token);
}

export function clearToken() {
  localStorage.removeItem('af_token');
}

async function request(method, path, body = null, isUpload = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };

  if (body && !isUpload) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isUpload) {
    // body is FormData — don't set Content-Type (browser sets boundary)
    opts.body = body;
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── CRUD factory for entities ──
function crudEntity(tableName) {
  return {
    list: (sort) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      const qs = params.toString();
      return request('GET', `/${tableName}${qs ? '?' + qs : ''}`);
    },
    filter: (filters) => {
      const params = new URLSearchParams();
      if (filters && typeof filters === 'object') {
        for (const [key, value] of Object.entries(filters)) {
          params.set(`filter[${key}]`, value);
        }
      }
      return request('GET', `/${tableName}?${params.toString()}`);
    },
    get: (id) => request('GET', `/${tableName}/${id}`),
    create: (data) => request('POST', `/${tableName}`, data),
    update: (id, data) => request('PUT', `/${tableName}/${id}`, data),
    delete: (id) => request('DELETE', `/${tableName}/${id}`),
  };
}

// ── Upload ──
async function uploadFile({ file }) {
  const formData = new FormData();
  formData.append('file', file);
  return request('POST', '/upload', formData, true);
}

// ── Public API (mirrors base44 SDK interface) ──
export const api = {
  auth: {
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    google: (token) => request('POST', '/auth/google', { token }),
    register: (data) => request('POST', '/auth/register', data),
    me: () => request('GET', '/auth/me'),
    invite: (email, role) => request('POST', '/auth/invite', { email, role }),
    logout: () => {
      clearToken();
      window.location.href = '/login';
    },
    redirectToLogin: (returnUrl) => {
      if (returnUrl) localStorage.setItem('af_return_url', returnUrl);
      window.location.href = '/login';
    },
  },
  entities: {
    User:            crudEntity('users'),
    Project:         crudEntity('projects'),
    Task:            crudEntity('tasks'),
    Ticket:          crudEntity('tickets'),
    PaymentIncoming: crudEntity('payments_incoming'),
    PaymentOutgoing: crudEntity('payments_outgoing'),
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
  users: {
    inviteUser: (email, role) => request('POST', '/auth/invite', { email, role }),
  },
};
