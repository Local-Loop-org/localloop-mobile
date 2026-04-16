import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  locationBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  locationGranted: {
    backgroundColor: colors.primary + '20', // semi-transparent primary
    borderColor: colors.success,
  },
  locationBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  finishBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
});
