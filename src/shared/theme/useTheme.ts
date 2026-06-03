// src/shared/theme/useTheme.ts
//
// Resolves the active palette from the theme store. Light/Dark only (no
// system-follow). Render-time consumers (StatusBar, NavigationContainer theme,
// migrated components) flip instantly when `mode` changes; static StyleSheets
// keep the dark `colors` until migrated in Phase 2.

import { useThemeStore, type ThemeMode } from '@/application/stores/theme.store';
import { darkColors, lightColors, type ThemeColors } from './index';

export interface Theme {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = mode === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    mode,
    isDark,
    setMode,
  };
}
