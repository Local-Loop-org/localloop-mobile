// src/application/stores/auth.store.ts

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/domain/user.entity';
import { STORAGE_KEYS } from '@/shared/constants';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, isNewUser?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setNewUserStatus: (isNewUser: boolean) => void;
  updateUser: (partial: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isNewUser: false,

  setAuth: async (user, accessToken, refreshToken, isNewUser = false) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    set({ user, accessToken, refreshToken, isAuthenticated: true, isNewUser });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isNewUser: false });
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

      if (accessToken && refreshToken && userData) {
        set({ 
          user: JSON.parse(userData), 
          accessToken, 
          refreshToken, 
          isAuthenticated: true,
          isNewUser: false
        });
      }
    } catch (e) {
      console.error('Failed to initialize auth store', e);
    }
  },

  setNewUserStatus: (isNewUser: boolean) => set({ isNewUser }),

  updateUser: async (partial) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    const updated = { ...user, ...partial };
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
    set({ user: updated });
  },
}));
