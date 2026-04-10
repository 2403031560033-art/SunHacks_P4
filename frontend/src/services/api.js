import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Accept': 'application/json' },
});

// ── Request interceptor: attach JWT token ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orgmemory_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('orgmemory_token');
      localStorage.removeItem('orgmemory_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────
export async function register(name, email, password) {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
}

export async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function getMe() {
  const response = await api.get('/api/auth/me');
  return response.data;
}

// ── Upload a file ──────────────────────────────────────────────
export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return response.data;
}

// ── Documents ──────────────────────────────────────────────────
export async function getDocuments() {
  const response = await api.get('/documents');
  return response.data;
}

export async function deleteDocument(docId) {
  const response = await api.delete(`/documents/${docId}`);
  return response.data;
}

// ── Query ──────────────────────────────────────────────────────
export async function queryAI(queryText) {
  const response = await api.post('/query', { query: queryText });
  return response.data;
}

// ── Decisions ──────────────────────────────────────────────────
export async function getDecisions() {
  const response = await api.get('/decisions');
  return response.data;
}

// ── Graph ──────────────────────────────────────────────────────
export async function getGraphData() {
  const response = await api.get('/graph');
  return response.data;
}

// ── Stats ──────────────────────────────────────────────────────
export async function getStats() {
  const response = await api.get('/stats');
  return response.data;
}

export default api;
