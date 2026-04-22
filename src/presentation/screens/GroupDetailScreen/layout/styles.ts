import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  anchor: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  metaValue: {
    color: colors.text,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  joinBtnDisabled: {
    backgroundColor: colors.surface,
  },
  joinBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
  joinBtnTextDisabled: {
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
