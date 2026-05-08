import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

export const TAB_BAR_BASE_BOTTOM_PADDING = spacing.lg + 2;

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
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    fontSize: 13,
  },
  centerWrapper: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
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

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerLabel: {
    fontSize: 10,
    color: colors.faint,
    letterSpacing: 1.6,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.3)',
    backgroundColor: 'rgba(0, 209, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 11,
    color: colors.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Horizontal scroll row
  horizontalRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },

  // Vertical list
  verticalList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },

  // My groups list (rows manage their own horizontal padding to match design)
  myGroupsList: {
    paddingTop: spacing.xs,
  },

  // Discover card (horizontal)
  card: {
    width: 220,
    padding: spacing.md - 2,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardAnchor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 10,
    color: colors.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
    flex: 1,
  },
  cardJoinBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  cardJoinText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: 0.2,
  },

  // Discover row (vertical)
  row: {
    padding: spacing.sm + 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
    marginTop: 2,
  },

  // My groups row (design: bare list-item, gradient icon, lastAt, unread badge)
  myRow: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myRowIconWrap: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  myRowLiveDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  myRowBody: {
    flex: 1,
    minWidth: 0,
  },
  myRowTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 8,
  },
  myRowName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  myRowLastAt: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 0.4,
  },
  myRowLastAtUnread: {
    color: colors.primary,
  },
  myRowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  myRowPreview: {
    flex: 1,
    fontSize: 12.5,
    color: colors.dim,
  },
  myRowPreviewUnread: {
    color: colors.text,
    fontWeight: '500',
  },
  myRowUnreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  myRowUnreadBadgeText: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    fontWeight: '700',
    color: colors.black,
  },

  // Bottom tab bar
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_BASE_BOTTOM_PADDING,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 28,
    padding: 6,
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    gap: 2,
  },
  tabBtnActive: {
    // active styling lives on the icon/label color — no bg change
  },
  tabBtnNew: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.text,
  },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: '50%',
    transform: [{ translateX: 14 }],
    minWidth: 14,
    height: 14,
    paddingHorizontal: 4,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 9,
    color: colors.black,
    fontWeight: '700',
  },
});
