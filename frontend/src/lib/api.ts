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
  // Remove Content-Type header for FormData - let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
    api.post('/products', data),
  
  updateProduct: (id: string, data: FormData) => 
    api.put(`/products/${id}`, data),
  
  toggleProduct: (id: string) => 
    api.patch(`/products/${id}/toggle`),
  
  deleteProduct: (id: string) => 
    api.delete(`/products/${id}`),
  
  increaseStock: (id: string, quantity: number) =>
    api.patch(`/products/${id}/increase-stock`, { quantity }),
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

// Availability APIs
export const availabilityApi = {
  requestAvailability: (data: { productId: string; sellerAlias: string }) =>
    api.post('/availability/request', data),
  
  getSellerRequests: () =>
    api.get('/availability/seller'),
  
  fulfillRequest: (id: string) =>
    api.patch(`/availability/${id}/fulfill`),
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
  
  // Broadcast settings
  getBroadcastsEnabled: () =>
    api.get('/admin/config/broadcasts-enabled'),
  
  setBroadcastsEnabled: (enabled: boolean) =>
    api.put('/admin/config/broadcasts-enabled', { enabled }),
  
  setSellerBroadcastsEnabled: (sellerId: string, enabled: boolean) =>
    api.put(`/admin/sellers/${sellerId}/broadcasts-enabled`, { enabled }),
  
  getContactInfo: () =>
    api.get('/admin/contact-info'),
};

// Issue Report APIs
export const issueApi = {
  reportIssue: (data: {
    title: string;
    description: string;
    pageUrl: string;
    screenshot: string;
    browserInfo?: {
      userAgent?: string;
      platform?: string;
      screenResolution?: string;
      viewportSize?: string;
    };
    issueType?: 'bug' | 'ui_issue' | 'feature_request' | 'other';
  }) => api.post('/issues/report', data),
  
  getMyIssues: () => api.get('/issues/my-issues'),
  
  getAllIssues: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/issues', { params }),
  
  getIssueStats: () => api.get('/issues/stats'),
  
  updateIssueStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    api.patch(`/issues/${id}/status`, data),
};

// Upload APIs
export const uploadApi = {
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/upload/logo', formData);
  },
  
  
  uploadSellerVideo: (file: File) => {
    const formData = new FormData();
    formData.append('sellerVideo', file);
    return api.post('/upload/seller-video', formData);
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
    return api.post('/bulk-upload/products', formData);
  },
};

// Analytics APIs
export const analyticsApi = {
  track: (data: {
    sellerAlias: string;
    eventType: string;
    sessionId?: string;
    buyerId?: string;
    productId?: string;
    page?: string;
    metadata?: Record<string, unknown>;
    visitorName?: string;
    visitorPhone?: string;
  }) => api.post('/analytics/track', data),
  
  getOverview: (period?: string) => 
    api.get('/analytics/overview', { params: { period } }),
  
  getProductAnalytics: (productId: string, period?: string) =>
    api.get(`/analytics/products/${productId}`, { params: { period } }),
  
  getVisitors: (period?: string, limit?: number) =>
    api.get('/analytics/visitors', { params: { period, limit } }),
};

// Broadcast APIs
export const broadcastApi = {
  // Subscriptions
  getSubscriptions: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/broadcasts/subscriptions', { params }),
  
  addSubscription: (data: { phone: string; name?: string; sellerId?: string }) =>
    api.post('/broadcasts/subscriptions', data),
  
  unsubscribe: (data: { phone?: string; sellerId?: string; token?: string }) =>
    api.post('/broadcasts/subscriptions/unsubscribe', data),
  
  getOptOutLink: (subscriptionId: string) =>
    api.get(`/broadcasts/subscriptions/${subscriptionId}/opt-out-link`),
  
  // Broadcasts
  getBroadcasts: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/broadcasts', { params }),
  
  getBroadcast: (id: string) =>
    api.get(`/broadcasts/${id}`),
  
  createBroadcast: (data: {
    title: string;
    message: string;
    type?: 'new_arrival' | 'promotion' | 'announcement' | 'custom';
    productId?: string;
    promotionId?: string;
    scheduledAt?: string;
  }) => api.post('/broadcasts', data),
  
  updateBroadcast: (id: string, data: {
    title?: string;
    message?: string;
    type?: 'new_arrival' | 'promotion' | 'announcement' | 'custom';
    productId?: string;
    promotionId?: string;
    scheduledAt?: string;
  }) => api.put(`/broadcasts/${id}`, data),
  
  sendBroadcast: (id: string) =>
    api.post(`/broadcasts/${id}/send`),
  
  deleteBroadcast: (id: string) =>
    api.delete(`/broadcasts/${id}`),
};

// Merchant Feed APIs
export const merchantFeedApi = {
  getFeedUrl: () =>
    api.get('/merchant-feed/my-feed-url'),
  
  getFeedInfo: () =>
    api.get('/merchant-feed/feed-info'),
};

export default api;

