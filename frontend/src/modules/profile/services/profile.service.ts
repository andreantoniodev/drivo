import { api } from '@/shared/services/api';
import { User } from '@/shared/auth/auth.types';

export const profileService = {
  async updateProfile(payload: { name: string; email: string }): Promise<User> {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },

  async updatePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.patch('/users/me/password', payload);
  },
};
