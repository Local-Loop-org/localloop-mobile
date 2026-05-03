// src/infra/api/auth.api.ts

import { User } from '@/domain/user.entity';
import { apiClient } from './api-client';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export const authApi = {
  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/google', { token });
    return data;
  },

  loginWithApple: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/apple', { token });
    return data;
  },
};
