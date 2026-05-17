import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';

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
});
