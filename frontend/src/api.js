// src/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const client = axios.create({ baseURL: API_BASE, timeout: 8000 });

// Items
export async function fetchItems() {
  const res = await client.get('/items');
  return res.data.data || res.data;
}
export async function borrowSession(payload) {
  const res = await client.post('/sessions/borrow', payload);
  return res.data;
}

// Sessions
// src/api.js  (update the fetchSessions function only)
export async function fetchSessions({ page = 1, limit = 50, student_reg_no, all = false } = {}) {
  // Build query string
  const params = new URLSearchParams();
  if (student_reg_no) params.append('student_reg_no', student_reg_no);
  if (all) params.append('all', 'true');
  // backend returns { data: [...] }
  const url = params.toString() ? `/sessions?${params.toString()}` : '/sessions';
  const res = await client.get(url);
  return res.data.data || res.data;
}

export async function fetchSessionById(id) {
  const res = await client.get(`/sessions/${id}`);
  return res.data;
}
export async function returnSession(sessionId, payload) {
  const res = await client.post(`/sessions/${sessionId}/return`, payload);
  return res.data;
}

// Analytics
export async function fetchTopBorrowed(days = 30, limit = 10) {
  const res = await client.get(`/analytics/top-borrowed?days=${days}&limit=${limit}`);
  return res.data.data || res.data;
}
export async function fetchLowStock(threshold = 5) {
  const res = await client.get(`/analytics/low-stock?threshold=${threshold}`);
  return res.data.data || res.data;
}

export default client;
