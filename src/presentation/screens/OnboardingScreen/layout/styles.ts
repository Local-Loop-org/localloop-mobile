import { StyleSheet } from 'react-native';
import { createTypography, spacing, type ThemeColors } from '@/shared/theme';

export const createStyles = (c: ThemeColors) => {
  const typography = createTypography(c);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      padding: spacing.xl,
      justifyContent: 'center',
    },
    subtitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
      color: c.textSecondary,
    },
    label: {
      ...typography.caption,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: c.surface,
      height: 56,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      color: c.text,
      fontSize: 16,
      marginBottom: spacing.lg,
    },
    locationBtn: {
      height: 56,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    locationGranted: {
      backgroundColor: c.primary + '20', // semi-transparent primary
      borderColor: c.success,
    },
    locationBtnText: {
      color: c.primary,
      fontWeight: '600',
    },
    finishBtn: {
      backgroundColor: c.primary,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    finishBtnText: {
      color: c.black,
      fontWeight: '700',
      fontSize: 16,
    },
  });
};
