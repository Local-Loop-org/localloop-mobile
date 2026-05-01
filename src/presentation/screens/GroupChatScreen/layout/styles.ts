import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

const HEADER_BTN = 38;
const HEADER_RADIUS = 11;
const ANCHOR_ICON = 36;
const PEER_AVATAR = 26;
const COMPOSER_BTN = 38;
const COMPOSER_RADIUS = 22;

export const layoutDimensions = {
  headerAnchor: ANCHOR_ICON,
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
  // --- separator ---
  separatorWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  separatorText: {
    fontSize: 10,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 1.6,
  },
  // --- own message ---
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  ownColumn: {
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  ownBubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  ownBubbleText: {
    color: colors.white,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  ownTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: colors.faint,
    marginTop: 2,
  },
  // --- peer message ---
  peerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginVertical: 4,
  },
  peerColumn: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  peerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    paddingLeft: 10,
  },
  peerName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text,
  },
  peerBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  peerBubbleText: {
    color: colors.text,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '400',
  },
  peerTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: colors.faint,
    marginTop: 2,
    paddingLeft: 10,
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
