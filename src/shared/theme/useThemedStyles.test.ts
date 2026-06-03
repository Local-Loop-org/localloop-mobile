import { StyleSheet } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_THEME_MODE, useThemeStore } from '@/application/stores/theme.store';
import { useThemedStyles } from './useThemedStyles';
import { darkColors, lightColors, type ThemeColors } from './index';

// A module-level factory so its identity is stable across renders (the cache key).
const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { backgroundColor: c.background, color: c.text },
  });

const setMode = (mode: 'dark' | 'light') =>
  act(() => {
    useThemeStore.setState({ mode });
  });

describe('useThemedStyles', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: DEFAULT_THEME_MODE });
  });

  it('resolves styles from the active (dark) palette by default', () => {
    const { result } = renderHook(() => useThemedStyles(createStyles));
    expect(result.current.box.backgroundColor).toBe(darkColors.background);
  });

  it('returns the light palette styles after switching mode', () => {
    const { result } = renderHook(() => useThemedStyles(createStyles));
    const darkStyles = result.current;

    setMode('light');

    expect(result.current).not.toBe(darkStyles);
    expect(result.current.box.backgroundColor).toBe(lightColors.background);
  });

  it('caches by (factory, palette) — same mode yields the same object identity', () => {
    const { result } = renderHook(() => useThemedStyles(createStyles));
    const firstDark = result.current;

    setMode('light');
    setMode('dark');

    expect(result.current).toBe(firstDark);
  });
});
