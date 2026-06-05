import { Platform, StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '@/shared/theme';

const HEADER_BTN = 38;
const HEADER_RADIUS = 11;
const PEER_AVATAR = 36;

export const layoutDimensions = {
  peerAvatar: PEER_AVATAR,
};

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
  // --- header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  iconBtn: {
    width: HEADER_BTN,
    height: HEADER_BTN,
    borderRadius: HEADER_RADIUS,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDisabled: {
    opacity: 0.45,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 4,
    borderRadius: 10,
  },
  headerCenterText: {
    flex: 1,
    flexShrink: 1,
  },
  peerAvatarWrap: {
    width: PEER_AVATAR,
    height: PEER_AVATAR,
    position: 'relative',
  },
  peerOnlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: c.success,
    borderWidth: 2,
    borderColor: c.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: monoFamily,
    fontWeight: '500',
    color: c.faint,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  headerSubtitleOnline: {
    color: c.success,
  },
  headerSubtitleTyping: {
    fontStyle: 'italic',
  },
  // --- content states ---
  errorText: {
    color: c.error,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: c.faint,
    textAlign: 'center',
  },
  loadingMoreWrapper: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
