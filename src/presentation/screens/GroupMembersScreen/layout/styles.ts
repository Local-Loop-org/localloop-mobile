import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowMain: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  role: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  banBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  banBtnDisabled: {
    opacity: 0.5,
  },
  banBtnText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
});
