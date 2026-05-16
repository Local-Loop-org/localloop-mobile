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
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
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
});
