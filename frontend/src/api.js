import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// Attach JWT token automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================================
   ITEMS
================================ */

/**
 * Fetch items list
 * @param {string} q optional search query
 * @param {number} limit optional limit
 */
export async function fetchItems(q = '', limit = 200) {
  const params = {};
  if (q) params.q = q;
  if (limit) params.limit = limit;

  const res = await client.get('/items', { params });
  return res.data?.data || res.data;
}

/**
 * Fetch single item by ID
 */
export async function fetchItemById(id) {
  const res = await client.get(`/items/${id}`);
  return res.data?.data || res.data;
}

/**
 * Create new item (ADMIN)
 * payload: { sku, name, description, total_quantity }
 */
export async function createItem(payload) {
  const res = await client.post('/items', payload);
  return res.data?.item || res.data;
}

/**
 * Update item metadata (ADMIN)
 */
export async function updateItem(id, payload) {
  const res = await client.put(`/items/${id}`, payload);
  return res.data?.item || res.data;
}

/**
 * Update item quantity (ADMIN)
 * change > 0 => add stock
 * change < 0 => remove stock
 */
export async function updateItemQuantity(id, change, user = 'admin-ui') {
  const res = await client.post(`/items/${id}/update-quantity`, {
    change,
    user
  });
  return res.data?.item || res.data;
}

/**
 * Delete item (ADMIN)
 * Will fail if item is currently borrowed
 */
export async function deleteItem(id) {
  const res = await client.delete(`/items/${id}`);
  return res.data;
}

/* ================================
   SESSIONS (BORROW / RETURN)
================================ */

/**
 * Create borrow session
 */
export async function borrowSession(payload) {
  const res = await client.post('/sessions/borrow', payload);
  return res.data;
}

/**
 * Fetch sessions
 * filters: { student_reg_no, all }
 */
export async function fetchSessions({
  student_reg_no,
  all = false
} = {}) {
  const params = {};
  if (student_reg_no) params.student_reg_no = student_reg_no;
  if (all) params.all = 'true';

  const res = await client.get('/sessions', { params });
  return res.data?.data || res.data;
}

/**
 * Fetch session by ID
 */
export async function fetchSessionById(id) {
  const res = await client.get(`/sessions/${id}`);
  return res.data?.data || res.data;
}

/**
 * Return items from a session
 * payload: { items: [{ item_id, qty }], user }
 */
export async function returnSession(sessionId, payload) {
  const res = await client.post(`/sessions/${sessionId}/return`, payload);
  return res.data;
}

/* ================================
   ANALYTICS (ADMIN)
================================ */

export async function fetchTopBorrowed(days = 30, limit = 10) {
  const res = await client.get('/analytics/top-borrowed', {
    params: { days, limit }
  });
  return res.data?.data || res.data;
}

export async function fetchLowStock(threshold = 5) {
  const res = await client.get('/analytics/low-stock', {
    params: { threshold }
  });
  return res.data?.data || res.data;
}

/* ================================
   BORROWERS (ADMIN)
================================ */

/**
 * Fetch borrowers list
 */
export async function fetchBorrowers(reg_no = '') {
  const params = {};
  if (reg_no) params.reg_no = reg_no;

  const res = await client.get('/borrowers', { params });
  return res.data?.data || res.data;
}

/**
 * Fetch borrower details
 */
export async function fetchBorrowerDetails(id) {
  const res = await client.get(`/borrowers/${id}`);
  return res.data;
}

/* ================================
   DEFAULT EXPORT
================================ */

export default client;
