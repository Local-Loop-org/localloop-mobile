import { Platform, StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '@/shared/theme';

export const TAB_BAR_BASE_BOTTOM_PADDING = spacing.lg + 2;

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  errorText: {
    color: c.error,
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
    color: c.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: c.textSecondary,
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
    color: c.text,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
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
    backgroundColor: c.line,
  },
  dividerLabel: {
    fontSize: 10,
    color: c.faint,
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
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 11,
    color: c.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: c.primary,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardLiveBadge: {
    minWidth: 40,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: `${c.success}2E`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  cardLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.success,
  },
  cardLiveText: {
    fontSize: 11,
    fontFamily: monoFamily,
    fontWeight: '700',
    color: c.success,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardAnchor: {
    fontSize: 11,
    color: c.textSecondary,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 10,
    color: c.faint,
    letterSpacing: 0.4,
    fontWeight: '600',
    flex: 1,
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
    backgroundColor: c.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderColor: c.line,
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
    backgroundColor: c.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: c.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: c.text,
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
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 9,
    color: c.black,
    fontWeight: '700',
  },
});
