import { create } from 'zustand';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  courier: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      set({ user: data.user, courier: data.courier, isAuthenticated: true, isLoading: false });
      connectSocket(token);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
    connectSocket(data.accessToken);
    return data;
  },

  register: async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
    connectSocket(data.accessToken);
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    disconnectSocket();
    set({ user: null, courier: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => ({ user: { ...state.user, ...userData } }));
  },
}));

export default useAuthStore;
