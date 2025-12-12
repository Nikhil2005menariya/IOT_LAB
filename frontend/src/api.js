// frontend/src/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const client = axios.create({ baseURL: API_BASE, timeout: 10000 });

// ---------------- Items ----------------

/**
 * Fetch items list
 * @param {string} q optional search query
 * @param {number} limit optional limit (default 200)
 * @returns {Array}
 */
export async function fetchItems(q = '', limit = 200) {
  const params = {};
  if (q) params.q = q;
  if (limit) params.limit = limit;
  const res = await client.get('/items', { params });
  // backend returns { data: [...] }
  return res.data && (res.data.data || res.data);
}

/**
 * Fetch single item by id
 * @param {string} id
 */
export async function fetchItemById(id) {
  const res = await client.get(`/items/${id}`);
  return res.data && (res.data.data || res.data);
}

/**
 * Create new item
 * payload: { sku, name, description, total_quantity, available_quantity, location, metadata }
 */
export async function createItem(payload) {
  const res = await client.post('/items', payload);
  return res.data && (res.data.item || res.data);
}

/**
 * Generic update (PUT) for item
 */
export async function updateItem(id, payload) {
  const res = await client.put(`/items/${id}`, payload);
  return res.data && (res.data.item || res.data);
}

/**
 * Update quantity endpoint
 * change: positive to add stock, negative to remove stock
 * user: optional string to track who made the change
 */
export async function updateItemQuantity(id, change, user = 'web-ui') {
  const res = await client.post(`/items/${id}/update-quantity`, { change, user });
  return res.data && (res.data.item || res.data);
}

// ---------------- Sessions ----------------

/**
 * Borrow session (create)
 * payload shape depends on your backend: { student_reg_no, items: [{ item_id, sku, name, qty }], due_date, createdBy }
 */
export async function borrowSession(payload) {
  const res = await client.post('/sessions/borrow', payload);
  return res.data;
}

/**
 * Fetch sessions (supports filters)
 * Options: { page, limit, student_reg_no, all }
 */
export async function fetchSessions({ page = 1, limit = 50, student_reg_no, all = false } = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (student_reg_no) params.student_reg_no = student_reg_no;
  if (all) params.all = 'true';

  const res = await client.get('/sessions', { params });
  return res.data && (res.data.data || res.data);
}

export async function fetchSessionById(id) {
  const res = await client.get(`/sessions/${id}`);
  return res.data && (res.data.data || res.data);
}

/**
 * Return items from a session
 * payload: { items: [{ item_id, qty }], user }
 */
export async function returnSession(sessionId, payload) {
  const res = await client.post(`/sessions/${sessionId}/return`, payload);
  return res.data;
}

// ---------------- Analytics ----------------

export async function fetchTopBorrowed(days = 30, limit = 10) {
  const res = await client.get('/analytics/top-borrowed', { params: { days, limit } });
  return res.data && (res.data.data || res.data);
}

export async function fetchLowStock(threshold = 5) {
  const res = await client.get('/analytics/low-stock', { params: { threshold } });
  return res.data && (res.data.data || res.data);
}

// default export axios client (if other modules need direct access)
export default client;
