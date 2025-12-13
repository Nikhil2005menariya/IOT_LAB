import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/v1';
const ANALYSIS_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const analysisApi = axios.create({
  baseURL: ANALYSIS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

analysisApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (username: string, password: string, role: 'admin' | 'system') => {
    const response = await api.post('/auth/login', { username, password, role });
    return response.data;
  },
};

// Items API
export const itemsApi = {
  getAll: async () => {
    const response = await api.get('/items');
    return response.data;
  },
  addItem: async (item: { name: string; sku: string; description: string; location: string; total_quantity: number }) => {
    const response = await api.post('/items', item);
    return response.data;
  },
  updateQuantity: async (id: string, change: number, user?: string) => {
    const response = await api.post(`/items/${id}/update-quantity`, { change, user });
    return response.data;
  },
  updateItem: async (id: string, data: Partial<{ name: string; sku: string; description: string; location: string }>) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },
  deleteItem: async (id: string) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
};

// Sessions API (Borrow/Return)
export const sessionsApi = {
  borrow: async (data: {
    student_reg_no: string;
    items: Array<{ item_id: string; sku: string; name: string; qty: number }>;
    createdBy: string;
  }) => {
    const response = await api.post('/sessions/borrow', data);
    return response.data;
  },
  getByStudent: async (student_reg_no: string) => {
    const response = await api.get(`/sessions?student_reg_no=${student_reg_no}`);
    return response.data;
  },
  returnItems: async (sessionId: string, items: Array<{ item_id: string; qty: number }>, user: string) => {
    const response = await api.post(`/sessions/${sessionId}/return`, { items, user });
    return response.data;
  },
};

// Borrowers API
export const borrowersApi = {
  getAll: async () => {
    const response = await api.get('/borrowers');
    return response.data;
  },
  search: async (reg_no: string) => {
    const response = await api.get(`/borrowers?reg_no=${reg_no}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/borrowers/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getTopBorrowed: async (days: number = 30, limit: number = 10) => {
    const response = await api.get(`/analytics/top-borrowed?days=${days}&limit=${limit}`);
    return response.data;
  },
  getLowStock: async (threshold: number = 5) => {
    const response = await api.get(`/analytics/low-stock?threshold=${threshold}`);
    return response.data;
  },
  getUsageOverTime: async (days: number = 30) => {
    const response = await analysisApi.get(`/analysis/usage?days=${days}`);
    return response.data;
  },
  getGeminiSummary: async (days: number = 30, top_n: number = 5, low_stock_threshold: number = 5) => {
    const response = await analysisApi.post('/analysis/gemini-summary', {
      days,
      top_n,
      low_stock_threshold,
    });
    return response.data;
  },
};

export { api, analysisApi };
