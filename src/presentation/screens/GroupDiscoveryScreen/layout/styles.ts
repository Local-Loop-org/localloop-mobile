import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  logoutBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  logoutText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120, // leave space for the FAB
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardName: {
    ...typography.h2,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  cardAnchor: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  proximity: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  memberCount: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
});
