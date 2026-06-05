import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/shared/constants';

export type ThemeMode = 'dark' | 'light';

// Dark is the default — design rule #6: "Light mode is parity, not the default."
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'dark' || value === 'light';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: DEFAULT_THEME_MODE,

  setMode: async (mode) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.THEME_PREFERENCE, mode);
    set({ mode });
  },

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEYS.THEME_PREFERENCE);
      if (isThemeMode(stored)) set({ mode: stored });
    } catch {
      // keep default
    }
  },
}));
