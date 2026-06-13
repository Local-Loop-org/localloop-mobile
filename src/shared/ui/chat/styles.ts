import { Platform, StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

const PEER_AVATAR = 26;

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
  // --- thread (FlatList content padding) ---
  threadContent: {
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
    color: c.faint,
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
    color: c.white,
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
    borderColor: c.error,
  },
  ownTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: c.faint,
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
    color: c.text,
  },
  peerBubble: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
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
    color: c.text,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '400',
  },
  peerTimestamp: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: c.faint,
    marginTop: 2,
    paddingLeft: 10,
  },
  editedSuffix: {
    fontSize: 9.5,
    fontFamily: monoFamily,
    color: c.faint,
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },

  // --- tombstone bubble (rendered when message.isDeleted is true) ---
  tombstoneBubble: {
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  tombstoneText: {
    color: c.dim,
    fontSize: 13.5,
    lineHeight: 18,
    fontStyle: 'italic',
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
    backgroundColor: c.quotedReplyBg,
  },
  quotedBlockPeer: {
    backgroundColor: c.surface2,
  },
  quotedRail: {
    width: 2.5,
    borderRadius: 2,
  },
  quotedBody: {
    flexShrink: 1,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.line,
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
    color: c.primary,
    textTransform: 'uppercase',
  },
  replyChipBodyText: {
    fontSize: 12.5,
    lineHeight: 16,
    color: c.dim,
  },
  replyChipCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  // --- edit preview chip (above composer) ---
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.line,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  editChipText: {
    flex: 1,
    fontFamily: monoFamily,
    fontSize: 10,
    letterSpacing: 1,
    color: c.primary,
  },
  editChipCancel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- inline edit error banner (above composer) ---
  editErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.error,
    borderRadius: 10,
    marginBottom: 6,
  },
  editErrorBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 16,
    color: c.error,
  },
  editErrorBannerDismiss: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: c.faint,
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
    color: c.accent2,
    letterSpacing: 0.4,
  },
  statusErrorText: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: c.error,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  statusErrorDivider: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: c.faint,
    letterSpacing: 0.4,
  },
  statusErrorRetry: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: c.error,
    letterSpacing: 0.4,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // --- composer (shared between DM and Group) ---
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  composerBarNoTopBorder: {
    borderTopWidth: 0,
  },
  composerAttachBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInputPill: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerInputTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: c.text,
    padding: 0,
  },
  composerSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  composerSendBtnDisabled: {
    opacity: 0.4,
  },
  composerAttachBtnDisabled: {
    opacity: 0.4,
  },
  composerDisabledHint: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  composerDisabledHintText: {
    fontSize: 12,
    color: c.dim,
    textAlign: 'center',
  },

  // --- swipe-to-reply wrap ---
  swipeWrap: {
    position: 'relative',
    width: '100%',
  },
  swipeIconReveal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIconRevealMe: {
    right: 4,
  },
  swipeIconRevealPeer: {
    left: 4,
  },
  swipeIconTile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- typing bubble ---
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  typingBubble: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
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
    backgroundColor: c.dim,
  },

  // --- DM action sheet ---
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.scrim,
  },
  sheetCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: c.line,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: c.line,
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
  sheetAnchorTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${c.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.3,
  },
  sheetHeaderSubtitle: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: c.dim,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: c.line,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconTileDanger: {
    backgroundColor: c.dangerSoft,
    borderColor: c.dangerBorder,
  },
  sheetRowText: {
    flex: 1,
    minWidth: 0,
  },
  sheetRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    letterSpacing: -0.2,
  },
  sheetRowLabelDanger: {
    color: c.error,
  },
  sheetRowSub: {
    fontSize: 11.5,
    color: c.dim,
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
    borderColor: `${c.accent2}8C`,
    backgroundColor: `${c.accent2}1A`,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  requestBannerIconTile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: `${c.accent2}2E`,
    borderWidth: 1,
    borderColor: `${c.accent2}66`,
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
    color: c.text,
    letterSpacing: -0.2,
  },
  requestBannerText: {
    fontSize: 11.5,
    color: c.dim,
    lineHeight: 16,
    marginTop: 2,
  },
  requestBannerTextStrong: {
    color: c.text,
    fontWeight: '700',
  },

  // --- DM request composer (locked input) ---
  requestComposer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: c.line,
    backgroundColor: c.surface,
  },
  requestComposerInner: {
    padding: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
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
    color: c.text,
    letterSpacing: -0.1,
  },
  requestComposerSub: {
    fontSize: 10.5,
    fontFamily: monoFamily,
    color: c.faint,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  requestComposerCancel: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.line,
  },
  requestComposerCancelText: {
    fontSize: 11,
    fontFamily: monoFamily,
    color: c.dim,
    letterSpacing: 0.6,
  },
});
