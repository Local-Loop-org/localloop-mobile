import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

const HEADER_BTN = 38;
const HEADER_RADIUS = 11;
const PEER_AVATAR = 36;
const COMPOSER_BTN = 38;
const COMPOSER_RADIUS = 22;

export const layoutDimensions = {
  peerAvatar: PEER_AVATAR,
};

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
  // --- header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconBtn: {
    width: HEADER_BTN,
    height: HEADER_BTN,
    borderRadius: HEADER_RADIUS,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
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
    color: colors.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: monoFamily,
    fontWeight: '500',
    color: colors.faint,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  headerSubtitleOnline: {
    color: colors.success,
  },
  headerSubtitleTyping: {
    fontStyle: 'italic',
  },
  // --- content states ---
  errorText: {
    color: colors.error,
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
    color: colors.faint,
    textAlign: 'center',
  },
  loadingMoreWrapper: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  // --- list ---
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
  },
  // --- composer ---
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  composerBtn: {
    width: COMPOSER_BTN,
    height: COMPOSER_BTN,
    borderRadius: HEADER_RADIUS,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSend: {
    width: COMPOSER_BTN,
    height: COMPOSER_BTN,
    borderRadius: HEADER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  composerSendDisabled: {
    opacity: 0.4,
  },
  inputPill: {
    flex: 1,
    minHeight: COMPOSER_BTN,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: COMPOSER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.text,
  },
});
