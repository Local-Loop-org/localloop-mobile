import { Platform, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';

const PEER_AVATAR = 26;

export const layoutDimensions = {
  peerAvatar: PEER_AVATAR,
};

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const styles = StyleSheet.create({
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

  // --- own message row ---
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 1,
    marginBottom: 1,
  },
  ownRowFirstOfRun: {
    marginTop: 6,
  },
  ownColumn: {
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  ownBubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  ownBubbleWithReply: {
    paddingTop: 6,
    paddingBottom: 9,
  },
  // Per-corner overrides — applied additively based on first/last-of-run
  ownBubbleMidTop: {
    borderTopRightRadius: 6,
  },
  ownBubbleMidBottom: {
    borderBottomRightRadius: 6,
  },
  ownBubbleTail: {
    borderBottomRightRadius: 4,
  },
  ownBubbleText: {
    color: colors.white,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  ownBubbleSending: {
    opacity: 0.72,
  },
  ownBubbleError: {
    opacity: 0.78,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  ownTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: colors.faint,
    marginTop: 2,
  },

  // --- peer message row ---
  peerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 1,
    marginBottom: 1,
  },
  peerRowFirstOfRun: {
    marginTop: 6,
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
  },
  peerBubbleWithReply: {
    paddingTop: 6,
    paddingBottom: 9,
  },
  peerBubbleMidTop: {
    borderTopLeftRadius: 6,
  },
  peerBubbleMidBottom: {
    borderBottomLeftRadius: 6,
  },
  peerBubbleTail: {
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

  // --- quoted reply block (inside a bubble) ---
  quotedBlock: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    paddingTop: 5,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 9,
    marginBottom: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quotedBlockMe: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  quotedBlockPeer: {
    backgroundColor: colors.surface2,
  },
  quotedRail: {
    width: 2.5,
    borderRadius: 2,
  },
  quotedBody: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  quotedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quotedAuthor: {
    fontFamily: monoFamily,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  quotedText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // --- reply preview chip (above composer) ---
  replyChip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  replyChipRail: {
    width: 3,
    borderRadius: 2,
  },
  replyChipBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  replyChipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyChipHeader: {
    fontFamily: monoFamily,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  replyChipBodyText: {
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.dim,
  },
  replyChipCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  // --- status row (sending / sent / read / pending / failed) ---
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  statusTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 0.4,
  },
  statusPendingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusPendingText: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: colors.accent2,
    letterSpacing: 0.4,
  },
  statusErrorText: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.error,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  statusErrorDivider: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 0.4,
  },
  statusErrorRetry: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.error,
    letterSpacing: 0.4,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // --- typing bubble ---
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dim,
  },

  // --- DM action sheet ---
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sheetHeaderSubtitle: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.dim,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 18,
    marginBottom: 6,
  },
  sheetList: {
    paddingHorizontal: 8,
  },
  sheetRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  sheetIconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconTileDanger: {
    backgroundColor: 'rgba(255,75,75,0.12)',
    borderColor: 'rgba(255,75,75,0.30)',
  },
  sheetRowText: {
    flex: 1,
    minWidth: 0,
  },
  sheetRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sheetRowLabelDanger: {
    color: colors.error,
  },
  sheetRowSub: {
    fontSize: 11.5,
    color: colors.dim,
    marginTop: 1,
  },

  // --- DM request banner ---
  requestBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(167,139,250,0.55)',
    backgroundColor: 'rgba(167,139,250,0.10)',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  requestBannerIconTile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(167,139,250,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBannerBody: {
    flex: 1,
    minWidth: 0,
  },
  requestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  requestBannerText: {
    fontSize: 11.5,
    color: colors.dim,
    lineHeight: 16,
    marginTop: 2,
  },
  requestBannerTextStrong: {
    color: colors.text,
    fontWeight: '700',
  },

  // --- DM request composer (locked input) ---
  requestComposer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  requestComposerInner: {
    padding: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestComposerText: {
    flex: 1,
    minWidth: 0,
  },
  requestComposerTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  requestComposerSub: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: colors.faint,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  requestComposerCancel: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  requestComposerCancelText: {
    fontSize: 11,
    fontFamily: monoFamily,
    color: colors.dim,
    letterSpacing: 0.6,
  },
});
