import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  registerSeller: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    businessName: string;
    theme?: string;
    businessDescription?: string;
  }) => api.post('/auth/register/seller', data),
  
  registerBuyer: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    sellerAlias: string;
  }) => api.post('/auth/register/buyer', data),
  
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: Record<string, unknown>) => 
    api.put('/auth/profile', data),

  verifyPhone: (token: string) =>
    api.get('/auth/verify-phone', { params: { token } }),
};

// Product APIs
export const productApi = {
  // Public
  getStoreProducts: (alias: string, params?: Record<string, string>) => 
    api.get(`/products/store/${alias}`, { params }),
  
  getStoreProduct: (alias: string, slug: string) => 
    api.get(`/products/store/${alias}/${slug}`),
  
  // Seller
  getMyProducts: (params?: Record<string, string>) => 
    api.get('/products/my-products', { params }),
  
  createProduct: (data: FormData) => 
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  updateProduct: (id: string, data: FormData) => 
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  toggleProduct: (id: string) => 
    api.patch(`/products/${id}/toggle`),
  
  deleteProduct: (id: string) => 
    api.delete(`/products/${id}`),
};

// Promotion APIs
export const promotionApi = {
  getAll: (params?: Record<string, string>) => 
    api.get('/promotions', { params }),
  
  create: (data: Record<string, unknown>) => 
    api.post('/promotions', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    api.put(`/promotions/${id}`, data),
  
  toggle: (id: string) => 
    api.patch(`/promotions/${id}/toggle`),
  
  delete: (id: string) => 
    api.delete(`/promotions/${id}`),
};

// Cart APIs
export const cartApi = {
  get: (sellerAlias: string) => 
    api.get(`/cart/${sellerAlias}`),
  
  add: (data: { productId: string; quantity: number; sellerAlias: string }) => 
    api.post('/cart/add', data),
  
  update: (data: { productId: string; quantity: number; sellerAlias: string }) => 
    api.put('/cart/update', data),
  
  remove: (sellerAlias: string, productId: string) => 
    api.delete(`/cart/remove/${sellerAlias}/${productId}`),
  
  checkout: (sellerAlias: string) => 
    api.post(`/cart/checkout/${sellerAlias}`),
};

// Admin APIs
export const adminApi = {
  getSellers: (params?: Record<string, string>) => 
    api.get('/admin/sellers', { params }),
  
  getStats: () => 
    api.get('/admin/stats'),
  
  getSeller: (id: string) => 
    api.get(`/admin/sellers/${id}`),
  
  approveSeller: (id: string) => 
    api.patch(`/admin/sellers/${id}/approve`),

  sendPhoneVerification: (id: string) =>
    api.post(`/admin/sellers/${id}/send-phone-verification`),
  
  toggleSeller: (id: string) => 
    api.patch(`/admin/sellers/${id}/toggle`),
  
  extendValidity: (id: string, months: number) => 
    api.patch(`/admin/sellers/${id}/extend-validity`, { months }),
};

// Upload APIs
export const uploadApi = {
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/upload/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Bulk Upload APIs
export const bulkUploadApi = {
  downloadSample: async () => {
    const response = await api.get('/bulk-upload/sample', {
      responseType: 'blob',
    });
    return response;
  },
  
  uploadProducts: (file: File) => {
    const formData = new FormData();
    formData.append('excel', file);
    return api.post('/bulk-upload/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;

