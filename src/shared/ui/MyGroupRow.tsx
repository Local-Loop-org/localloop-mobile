import React from 'react';
import { AnchorIconBadge } from '@/shared/icons';
import { formatLastActivity } from '@/shared/format/lastActivity';
import { ConversationRow } from '@/shared/ui/ConversationRow';
import type { MyGroup } from '@/infra/api/groups.api';

interface Props {
  group: MyGroup;
  onPress: (id: string) => void;
}

export function MyGroupRow({ group, onPress }: Props) {
  const live = group.liveCount ?? 0;
  const lastAt = group.lastMessage
    ? formatLastActivity(group.lastMessage.createdAt)
    : null;
  const preview = group.lastMessage
    ? `${group.lastMessage.senderName}: ${group.lastMessage.content ?? '[mídia]'}`
    : `${group.memberCount} membros`;

  return (
    <ConversationRow
      leftSlot={
        <AnchorIconBadge
          anchorType={group.anchorType}
          size={48}
          iconSize={20}
          borderRadius={14}
        />
      }
      isLive={live > 0}
      liveTestID={`my-group-live-dot-${group.id}`}
      title={group.name}
      preview={preview}
      lastAt={lastAt}
      unreadCount={group.unreadCount}
      accessibilityLabel={`Abrir ${group.name}`}
      onPress={() => onPress(group.id)}
    />
  );
}
