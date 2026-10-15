import { api } from '@/shared/services/api';
import { AuthResponse, User } from './auth.types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    return data;
  },
};
