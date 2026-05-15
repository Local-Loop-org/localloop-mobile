import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnchorIconBadge } from '@/shared/icons';
import { formatLastActivity } from '@/shared/format/lastActivity';
import { colors, spacing } from '@/shared/theme';
import type { MyGroup } from '@/infra/api/groups.api';

interface Props {
  group: MyGroup;
  onPress: (id: string) => void;
}

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export function MyGroupRow({ group, onPress }: Props) {
  const unread = group.unreadCount;
  const live = group.liveCount ?? 0;
  const hasUnread = unread > 0;
  const isLive = live > 0;
  const lastAt = group.lastMessage
    ? formatLastActivity(group.lastMessage.createdAt)
    : null;
  const preview = group.lastMessage
    ? `${group.lastMessage.senderName}: ${group.lastMessage.content ?? '[mídia]'}`
    : `${group.memberCount} membros`;

  return (
    <TouchableOpacity
      style={styles.myRow}
      onPress={() => onPress(group.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.myRowIconWrap}>
        <AnchorIconBadge
          anchorType={group.anchorType}
          size={48}
          iconSize={20}
          borderRadius={14}
        />
        {isLive ? (
          <View
            style={styles.myRowLiveDot}
            testID={`my-group-live-dot-${group.id}`}
          />
        ) : null}
      </View>
      <View style={styles.myRowBody}>
        <View style={styles.myRowTopLine}>
          <Text style={styles.myRowName} numberOfLines={1}>
            {group.name}
          </Text>
          {lastAt ? (
            <Text
              style={[
                styles.myRowLastAt,
                hasUnread && styles.myRowLastAtUnread,
              ]}
            >
              {lastAt}
            </Text>
          ) : null}
        </View>
        <View style={styles.myRowBottomLine}>
          <Text
            style={[
              styles.myRowPreview,
              hasUnread && styles.myRowPreviewUnread,
            ]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View style={styles.myRowUnreadBadge}>
              <Text style={styles.myRowUnreadBadgeText}>{unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
