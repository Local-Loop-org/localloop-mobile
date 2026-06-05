// src/shared/theme/useThemedStyles.ts
//
// The Phase-2 migration tool. Converts a static `StyleSheet.create({...})` into
// a theme-reactive one: move the body into a module-level factory
// `(c: ThemeColors) => StyleSheet.create({...})`, then call
// `const styles = useThemedStyles(createStyles)` inside the component.
//
//   ❌ before:  const styles = StyleSheet.create({ box: { color: colors.text } });
//   ✅ after:   const createStyles = (c: ThemeColors) =>
//                 StyleSheet.create({ box: { color: c.text } });
//               // inside the component:
//               const styles = useThemedStyles(createStyles);
//
// Pure screen layouts (architecture.md: "no hooks, no store reads") must NOT
// use this hook — there the container reads `useTheme()` and passes `colors`
// down as a prop, and the layout calls `createStyles(colors)` directly.
//
// `darkColors`/`lightColors` are stable singletons, so the WeakMap cache yields
// at most one StyleSheet per (factory, palette) for the whole app lifetime —
// no churn on toggle, no re-creation on re-render.

import { useMemo } from 'react';
import type { StyleSheet } from 'react-native';
import { useTheme } from './useTheme';
import type { ThemeColors } from './index';

type NamedStyles = ReturnType<typeof StyleSheet.create>;

const cache = new WeakMap<object, WeakMap<ThemeColors, unknown>>();

export function useThemedStyles<T extends NamedStyles>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => {
    let byPalette = cache.get(factory);
    if (!byPalette) {
      byPalette = new WeakMap<ThemeColors, unknown>();
      cache.set(factory, byPalette);
    }
    let styles = byPalette.get(colors) as T | undefined;
    if (!styles) {
      styles = factory(colors);
      byPalette.set(colors, styles);
    }
    return styles;
  }, [factory, colors]);
}
