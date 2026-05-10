import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/shared/constants';

export const DEFAULT_DISCOVERY_RADIUS_KM = 25;

interface PreferencesState {
  discoveryRadiusKm: number;
  setDiscoveryRadiusKm: (km: number) => Promise<void>;
  initialize: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  discoveryRadiusKm: DEFAULT_DISCOVERY_RADIUS_KM,

  setDiscoveryRadiusKm: async (km) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.DISCOVERY_RADIUS_KM, String(km));
    set({ discoveryRadiusKm: km });
  },

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEYS.DISCOVERY_RADIUS_KM);
      if (stored !== null) set({ discoveryRadiusKm: parseFloat(stored) });
    } catch {
      // keep default
    }
  },
}));
