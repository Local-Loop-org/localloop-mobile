import React from 'react';
import Avatar from '@/shared/ui/Avatar';
import { ConversationRow } from '@/shared/ui/ConversationRow';
import { formatLastActivity } from '@/shared/format/lastActivity';
import type { DmConversation } from '../types';

interface DmRowProps {
  dm: DmConversation;
  onPress: (id: string) => void;
}

function composePreview(dm: DmConversation): string {
  if (!dm.lastMessage) return '—';
  const { content, fromMe } = dm.lastMessage;
  return fromMe ? `Você: ${content}` : content;
}

export function DmRow({ dm, onPress }: DmRowProps) {
  const lastAt = dm.lastMessage ? formatLastActivity(dm.lastMessage.createdAt) : null;

  return (
    <ConversationRow
      leftSlot={
        <Avatar
          name={dm.peer.displayName}
          uri={dm.peer.avatarUrl}
          size={48}
        />
      }
      title={dm.peer.displayName}
      preview={composePreview(dm)}
      lastAt={lastAt}
      unreadCount={dm.unreadCount}
      accessibilityLabel={`Abrir conversa com ${dm.peer.displayName}`}
      onPress={() => onPress(dm.id)}
      testID={`dm-row-${dm.id}`}
    />
  );
}
