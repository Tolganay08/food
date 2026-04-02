import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Restaurant API
export const restaurantAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  getCuisines: () => api.get('/restaurants/cuisines'),
};

// Menu API
export const menuAPI = {
  getByRestaurant: (id, params) => api.get(`/menu/restaurant/${id}`, { params }),
  getById: (id) => api.get(`/menu/${id}`),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  assignCourier: (id, courierId) => api.patch(`/orders/${id}/assign-courier`, { courierId }),
};

// Courier API
export const courierAPI = {
  getProfile: () => api.get('/couriers/profile'),
  updateLocation: (data) => api.patch('/couriers/location', data),
  toggleAvailability: (isOnline) => api.patch('/couriers/availability', { isOnline }),
  getAvailableOrders: () => api.get('/couriers/available-orders'),
  getMyDeliveries: () => api.get('/couriers/my-deliveries'),
  acceptOrder: (orderId) => api.patch(`/couriers/accept-order/${orderId}`),
  getAll: () => api.get('/couriers'),
};

// Payment API
export const paymentAPI = {
  createIntent: (data) => api.post('/payments/create-intent', data),
  confirm: (data) => api.post('/payments/confirm', data),
  cashPayment: (data) => api.post('/payments/cash', data),
};

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getRestaurants: () => api.get('/admin/restaurants'),
  getRestaurantById: (id) => api.get(`/admin/restaurants/${id}`),
  createRestaurant: (data) => api.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
  createMenuItem: (data) => api.post('/admin/menu-items', data),
  updateMenuItem: (id, data) => api.put(`/admin/menu-items/${id}`, data),
  createCategory: (data) => api.post('/admin/categories', data),
  getUsers: () => api.get('/admin/users'),
};

// Review API
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByRestaurant: (id) => api.get(`/reviews/restaurant/${id}`),
};

// User API
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
};

export default api;
