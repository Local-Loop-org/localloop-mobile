// src/shared/theme/index.ts
//
// LocalLoop design system — single source of truth for color, type, spacing,
// radius. Values are lifted verbatim from the Claude Design handoff bundle
// ("LocalLoop — Design System", v1.0). Two parity palettes share one duotone
// logic (cyan → violet) and one green "live" signal.
//
// Theming (Phase 2 complete): React Native bakes StyleSheet.create() values at
// module load, so there is no static `colors`/`typography` export — every screen
// reads the active palette at render time via `useTheme()` / `useThemedStyles()`
// (and `createTypography(colors)` for type), so the Light/Dark toggle repaints
// instantly. Dark is the design default ("light is parity, not the default").
// See docs/theming.md.

import { Platform } from 'react-native';

/* ─── Palettes ──────────────────────────────────────────────────────────── */

export const darkColors = {
  // Brand duotone
  primary: '#00D9FF', // accent — primary signal (cyan)
  secondary: '#B06CFF', // aligned to accent-2 (no third hue — design rule #1)
  accent2: '#B06CFF', // accent-2 — distinction (violet)
  accentInk: '#070710', // ink on top of accent fills / gradients

  // Surfaces
  background: '#0A0A0D', // bg — page
  surface: '#15151B', // surface — card
  surface2: '#1F1F27', // surface-2 — raised / nested

  // Text
  text: '#FAFAFF', // foreground
  textSecondary: 'rgba(250,250,255,0.60)', // dim — secondary text
  dim: 'rgba(250,250,255,0.60)', // dim — secondary text
  faint: 'rgba(250,250,255,0.35)', // faint — meta / mono

  // Lines
  line: 'rgba(255,255,255,0.07)', // hairline
  lineStrong: 'rgba(255,255,255,0.14)', // emphasized border (ghost button)

  // Status
  error: '#FF5B6B', // danger — destructive
  success: '#33E07C', // live — presence
  warning: '#F0A24A', // app-only (design has no warning token)

  // Fixed
  white: '#FFFFFF',
  black: '#000000',
  google: '#DB4437',
  apple: '#000000',

  // Semantic alpha tokens (de-inlined from the prototypes; used in Phase 2)
  duotoneSoftFrom: 'rgba(0,217,255,0.16)', // soft gradient pair (tiles/banners/icon wrap)
  duotoneSoftTo: 'rgba(176,108,255,0.16)',
  anchorTileBorder: 'rgba(0,217,255,0.20)',
  primarySoft: 'rgba(0,217,255,0.10)',
  primarySoft08: 'rgba(0,217,255,0.08)',
  primaryBorder: 'rgba(0,217,255,0.35)',
  dangerSoft: 'rgba(255,91,107,0.13)',
  dangerBorder: 'rgba(255,91,107,0.30)',
  scrim: 'rgba(0,0,0,0.60)', // modal / sheet backdrop
  quotedReplyBg: 'rgba(255,255,255,0.16)', // quoted reply block on own bubble
  switchTrackOff: '#262630', // Switch / segmented "off" track
};

/** Structural type — both palettes must expose exactly these keys. */
export type ThemeColors = typeof darkColors;

export const lightColors: ThemeColors = {
  // Brand duotone (pulled down for legibility on white)
  primary: '#0084B8',
  secondary: '#7A3CFF',
  accent2: '#7A3CFF',
  accentInk: '#FFFFFF',

  // Surfaces
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surface2: '#EDEDF5',

  // Text
  text: '#0A0A0D',
  textSecondary: 'rgba(10,10,13,0.60)',
  dim: 'rgba(10,10,13,0.60)',
  faint: 'rgba(10,10,13,0.35)',

  // Lines
  line: 'rgba(10,10,15,0.08)',
  lineStrong: 'rgba(10,10,15,0.16)',

  // Status
  error: '#D8303F',
  success: '#0EAD50',
  warning: '#B5701A',

  // Fixed
  white: '#FFFFFF',
  black: '#000000',
  google: '#DB4437',
  apple: '#000000',

  // Semantic alpha tokens
  duotoneSoftFrom: 'rgba(0,132,184,0.16)',
  duotoneSoftTo: 'rgba(122,60,255,0.16)',
  anchorTileBorder: 'rgba(0,132,184,0.30)',
  primarySoft: 'rgba(0,132,184,0.10)',
  primarySoft08: 'rgba(0,132,184,0.10)',
  primaryBorder: 'rgba(0,132,184,0.40)',
  dangerSoft: 'rgba(216,48,63,0.12)',
  dangerBorder: 'rgba(216,48,63,0.30)',
  scrim: 'rgba(10,10,15,0.35)',
  quotedReplyBg: 'rgba(10,10,15,0.10)',
  switchTrackOff: '#D4D4DE', // Switch / segmented "off" track
};

/* ─── Fonts ─────────────────────────────────────────────────────────────── */
//
// Space Grotesk for everything human (names, messages, headings); JetBrains
// Mono in tracked caps for everything sensed (distance, timestamps, counts,
// status). Family strings match @expo-google-fonts exports and only resolve
// once the fonts are loaded (RootNavigator gates render on this).
//
// Kept FLAT with string values for backward-compat: existing call sites do
// `fontFamily: fonts.mono`, which must stay a string.

export const fonts = {
  display: 'SpaceGrotesk_400Regular',
  displayMedium: 'SpaceGrotesk_500Medium',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemibold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
  // Pre-load fallback (system mono) — unused once fonts load, kept for safety.
  systemMono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

/* ─── Spacing & radius ──────────────────────────────────────────────────── */
// 4px base. Existing keys kept (already on the base); design's 12/20/40 added.

export const spacing = {
  xs: 4,
  sm: 8,
  space3: 12,
  md: 16,
  space5: 20,
  lg: 24,
  xl: 32,
  space10: 40,
  xxl: 48,
};

export const radius = {
  xs: 6, // chips inner
  sm: 8, // small pills / inputs aux
  md: 12, // input
  lg: 14, // content / tiles
  xl: 16, // large cards
  xxl: 22, // modals / sheets
  pill: 999, // actions
};

/* ─── Typography ────────────────────────────────────────────────────────── */
//
// Factory so color (and the whole scale) is themed at render time. Existing keys
// (h1/h2/body/caption) keep their current sizes/weights so no screen shifts;
// design additions (display/label/monoCaps) are new keys. Consumers call
// `createTypography(useTheme().colors)` — there is no dark-baked default export.

export const createTypography = (c: ThemeColors) => ({
  display: {
    fontFamily: fonts.displaySemibold,
    fontSize: 56,
    fontWeight: '600' as const,
    letterSpacing: -1.7,
    color: c.text,
  },
  h1: {
    fontFamily: fonts.displaySemibold,
    fontSize: 32,
    fontWeight: '700' as const,
    color: c.text,
  },
  h2: {
    fontFamily: fonts.displaySemibold,
    fontSize: 24,
    fontWeight: '600' as const,
    color: c.text,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '400' as const,
    color: c.text,
  },
  caption: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '400' as const,
    color: c.textSecondary,
  },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.text,
  },
  monoCaps: {
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.76, // ~0.16em at 11px
    textTransform: 'uppercase' as const,
    color: c.faint,
  },
});
