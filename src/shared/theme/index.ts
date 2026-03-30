// src/shared/theme/index.ts

export const colors = {
  primary: '#00D1FF',      // Cyan
  secondary: '#7000FF',    // Purple
  background: '#0F0F0F',   // Almost Black
  surface: '#1E1E1E',      // Dark Gray
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  error: '#FF4B4B',
  success: '#00E676',
  white: '#FFFFFF',
  black: '#000000',
  google: '#DB4437',
  apple: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
};
