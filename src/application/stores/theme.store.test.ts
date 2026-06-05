import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/shared/constants';
import { DEFAULT_THEME_MODE, useThemeStore } from './theme.store';

const resetStore = () => useThemeStore.setState({ mode: DEFAULT_THEME_MODE });

describe('useThemeStore', () => {
  beforeEach(() => {
    resetStore();
    (SecureStore.setItemAsync as jest.Mock).mockClear();
    (SecureStore.getItemAsync as jest.Mock).mockClear();
    (SecureStore as unknown as { __store: Map<string, string> }).__store.clear();
  });

  it('defaults to dark (design rule: light is parity, not default)', () => {
    expect(DEFAULT_THEME_MODE).toBe('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  describe('setMode', () => {
    it('persists the preference and updates state', async () => {
      await useThemeStore.getState().setMode('light');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.THEME_PREFERENCE,
        'light',
      );
      expect(useThemeStore.getState().mode).toBe('light');
    });
  });

  describe('initialize', () => {
    it('adopts a persisted preference', async () => {
      await SecureStore.setItemAsync(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      await useThemeStore.getState().initialize();

      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('keeps the default when nothing is stored', async () => {
      await useThemeStore.getState().initialize();

      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('ignores an invalid stored value', async () => {
      await SecureStore.setItemAsync(STORAGE_KEYS.THEME_PREFERENCE, 'sepia');

      await useThemeStore.getState().initialize();

      expect(useThemeStore.getState().mode).toBe('dark');
    });
  });
});
