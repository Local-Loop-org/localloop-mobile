import { User, Provider, DmPermission } from '@/domain/user.entity';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

// Em ambiente de simulador iOS use localhost. 
// No Android use 10.0.2.2.
const API_URL = 'http://localhost:3000';

export const authApi = {
  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Falha no login com Google');
    }

    const data = await response.json();
    return {
      user: {
        ...data.user,
        // Mapping backend fields to domain entity if needed
        isActive: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isNewUser: data.isNewUser,
    };
  },

  loginWithApple: async (token: string, identityToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/apple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, identityToken }),
    });

    if (!response.ok) {
      throw new Error('Falha no login com Apple');
    }

    const data = await response.json();
    return {
      user: {
        ...data.user,
        isActive: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isNewUser: data.isNewUser,
    };
  },
};
