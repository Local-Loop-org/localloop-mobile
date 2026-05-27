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

  // --- variant picker ---
  pickerWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pickerTitle: {
    fontSize: 10,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 1.6,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  pickerRow: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 6,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pickerPillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,209,255,0.12)',
  },
  pickerPillText: {
    fontSize: 11,
    fontFamily: monoFamily,
    color: colors.dim,
    letterSpacing: 0.4,
  },
  pickerPillTextActive: {
    color: colors.primary,
  },

  // --- chat surface ---
  chatSurface: {
    flex: 1,
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
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
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
    color: colors.primary,
  },
  headerSubtitlePending: {
    color: colors.accent2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
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
  composerNoTopBorder: {
    borderTopWidth: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPillText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
  },
  inputPillPlaceholder: {
    color: colors.faint,
  },
});
