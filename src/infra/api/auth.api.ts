// src/infra/api/auth.api.ts

import { User } from '@/domain/user.entity';
import { apiClient } from './api-client';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

interface BackendAuthResponse {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    provider: User['provider'];
  };
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export const authApi = {
  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/google', { token });
    return mapToAuthResponse(data);
  },

  loginWithApple: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/apple', { token });
    return mapToAuthResponse(data);
  },
};

function mapToAuthResponse(data: BackendAuthResponse): AuthResponse {
  return {
    user: {
      id: data.user.id,
      displayName: data.user.displayName,
      avatarUrl: data.user.avatarUrl,
      provider: data.user.provider,
      // Fields not yet returned by the auth endpoint — filled in after GET /users/me
      providerId: '',
      geohash: null,
      dmPermission: 'members' as User['dmPermission'],
      isActive: true,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    isNewUser: data.isNewUser,
  };
}
