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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    marginTop: spacing.xs,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectionDotOnline: {
    backgroundColor: colors.success,
  },
  connectionDotOffline: {
    backgroundColor: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  messageRow: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageRowTheirs: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
  },
  senderName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    marginLeft: spacing.sm,
  },
  content: {
    fontSize: 15,
  },
  contentMine: {
    color: colors.black,
  },
  contentTheirs: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginHorizontal: spacing.sm,
  },
  timestampMine: {
    textAlign: 'right',
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
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
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    fontSize: 15,
    marginRight: spacing.sm,
  },
  sendBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: colors.black,
    fontWeight: '700',
  },
  loadingMoreWrapper: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
