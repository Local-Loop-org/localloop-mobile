import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnchorIconBadge } from '@/shared/icons';
import { formatLastActivity } from '@/shared/format/lastActivity';
import type { MyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

interface Props {
  group: MyGroup;
  onPress: (id: string) => void;
}

export function MyGroupRow({ group, onPress }: Props) {
  const unread = group.unreadCount ?? 0;
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
        {isLive ? <View style={styles.myRowLiveDot} /> : null}
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
