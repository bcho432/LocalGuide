import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/users/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/users/register', { name, email, password });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/api/users/profile');
    return response.data.user;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put('/api/users/profile', userData);
    return response.data.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/api/users/change-password', { currentPassword, newPassword });
  },

  async getActivity(): Promise<any> {
    const response = await api.get('/api/users/activity');
    return response.data.activity;
  },
}; 