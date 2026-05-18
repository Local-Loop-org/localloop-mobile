import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.dim,
    letterSpacing: 1.4,
    marginTop: 3,
  },
  headerSubtitleAccent: {
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chip row
  chipScrollOuter: {
    flexGrow: 0,
  },
  chipScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 6,
    alignItems: 'center',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyWrap: {
    paddingVertical: 60,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  // Request row
  requestRow: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  requestBody: {
    flex: 1,
    minWidth: 0,
  },
  requestTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  requestAt: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 0.4,
  },
  requestMessage: {
    fontSize: 12.5,
    color: colors.dim,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 6,
  },
  requestAcceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  requestAcceptText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: 0.1,
  },
  requestIgnoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  requestActionDisabled: {
    opacity: 0.45,
  },
  requestIgnoreText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.dim,
    letterSpacing: 0.1,
  },
});
