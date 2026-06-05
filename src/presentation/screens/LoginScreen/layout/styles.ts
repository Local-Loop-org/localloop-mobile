import { StyleSheet } from 'react-native';
import { createTypography, spacing, type ThemeColors } from '@/shared/theme';

export const createStyles = (c: ThemeColors) => {
  const typography = createTypography(c);
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: 'space-between',
    },
    header: {
      marginTop: 100,
      alignItems: 'center',
    },
    title: {
      color: c.primary,
      marginBottom: spacing.sm,
    },
    footer: {
      marginBottom: spacing.xxl,
    },
    button: {
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    googleButton: {
      backgroundColor: c.white,
    },
    appleButton: {
      backgroundColor: c.black,
    },
    buttonText: {
      ...typography.body,
      fontWeight: '600',
      color: c.black,
    },
  });
};
