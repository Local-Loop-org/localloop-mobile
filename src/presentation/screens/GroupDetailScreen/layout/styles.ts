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
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  modSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  emptyRequests: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  requestName: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  requestActions: {
    flexDirection: 'row',
  },
  approveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  approveBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  rejectBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  leaveBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
  },
  leaveBtnDisabled: {
    opacity: 0.5,
  },
  leaveBtnText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 15,
  },
  leaveHelper: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
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
