import axios from 'axios';

// Dynamically set API URL based on environment, window location origin, or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000');

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically inject Authorization header
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to extract clean error messages
client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response) {
      message = error.response.data?.detail || message;
    } else if (error.request) {
      message = 'Failed to connect to the backend server. Please verify it is running.';
    }
    return Promise.reject(new Error(message));
  }
);

export const api = {
  dashboard: {
    getStats: () => client.get('/dashboard/stats').then((res) => res.data),
  },
  products: {
    getAll: () => client.get('/products').then((res) => res.data),
    getById: (id) => client.get(`/products/${id}`).then((res) => res.data),
    create: (data) => client.post('/products', data).then((res) => res.data),
    update: (id, data) => client.put(`/products/${id}`, data).then((res) => res.data),
    delete: (id) => client.delete(`/products/${id}`).then((res) => res.data),
    restock: (id, qty) => client.post(`/products/${id}/restock?quantity=${qty}`).then((res) => res.data),
  },
  customers: {
    getAll: () => client.get('/customers').then((res) => res.data),
    getById: (id) => client.get(`/customers/${id}`).then((res) => res.data),
    create: (data) => client.post('/customers', data).then((res) => res.data),
    delete: (id) => client.delete(`/customers/${id}`).then((res) => res.data),
  },
  orders: {
    getAll: () => client.get('/orders').then((res) => res.data),
    getById: (id) => client.get(`/orders/${id}`).then((res) => res.data),
    create: (data) => client.post('/orders', data).then((res) => res.data),
    delete: (id) => client.delete(`/orders/${id}`).then((res) => res.data),
  },
};
