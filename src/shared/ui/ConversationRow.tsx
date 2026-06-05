import React, { type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { spacing, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ConversationRowProps {
  leftSlot: ReactNode;
  isLive?: boolean;
  title: string;
  preview: string;
  lastAt: string | null;
  unreadCount: number;
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
  liveTestID?: string;
}

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export function ConversationRow({
  leftSlot,
  isLive,
  title,
  preview,
  lastAt,
  unreadCount,
  accessibilityLabel,
  onPress,
  testID,
  liveTestID,
}: ConversationRowProps) {
  const styles = useThemedStyles(createStyles);
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        {leftSlot}
        {isLive ? <View style={styles.liveDot} testID={liveTestID} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {lastAt ? (
            <Text style={[styles.lastAt, hasUnread && styles.lastAtUnread]}>
              {lastAt}
            </Text>
          ) : null}
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      position: 'relative',
    },
    liveDot: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.success,
      borderWidth: 2.5,
      borderColor: c.background,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 3,
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: '700',
      color: c.text,
    },
    lastAt: {
      fontSize: 10.5,
      fontFamily: monoFamily,
      color: c.faint,
      letterSpacing: 0.4,
    },
    lastAtUnread: {
      color: c.primary,
    },
    bottomLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    preview: {
      flex: 1,
      fontSize: 12.5,
      color: c.dim,
    },
    previewUnread: {
      color: c.text,
      fontWeight: '500',
    },
    unreadBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    unreadBadgeText: {
      fontSize: 10.5,
      fontFamily: monoFamily,
      fontWeight: '700',
      color: c.black,
    },
  });
