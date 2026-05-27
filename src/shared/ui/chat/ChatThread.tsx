import React, { useMemo } from 'react';
import { FlatList, StyleProp, ViewStyle } from 'react-native';
import type { ChatMessage } from '@localloop/shared-types';
import {
  buildChatListItems,
  type ChatListItem,
} from '@/shared/format/chat';
import { OwnBubble, type OwnBubbleStatus } from './OwnBubble';
import { PeerBubble } from './PeerBubble';
import { DaySeparatorItem } from './DaySeparatorItem';
import { TypingBubble } from './TypingBubble';
import { styles as chatStyles } from './styles';

export interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId: string;

  /** Per-message status overrides, keyed by message id (own messages only). */
  messageStatuses?: Record<string, OwnBubbleStatus>;
  /** Per-message reply target: message id → original message id (must also be in `messages`). */
  messageReplyTo?: Record<string, string>;

  /** Group chat shows sender names on peer bubbles; DM hides them. */
  showPeerSenderName?: boolean;
  /** Render a typing bubble at the bottom of the list. */
  showTypingBubble?: boolean;

  // ── handlers (all optional) ──────────────────────────────────
  onSwipeReply?: (messageId: string) => void;
  onPressRetry?: (messageId: string) => void;
  onPressReplyOriginal?: (originalMessageId: string) => void;
  onPressPeerAvatar?: (senderId: string) => void;

  // ── FlatList passthroughs ────────────────────────────────────
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const EMPTY_STATUSES: Record<string, OwnBubbleStatus> = {};
const EMPTY_REPLY_TO: Record<string, string> = {};

export function ChatThread({
  messages,
  currentUserId,
  messageStatuses = EMPTY_STATUSES,
  messageReplyTo = EMPTY_REPLY_TO,
  showPeerSenderName = false,
  showTypingBubble = false,
  onSwipeReply,
  onPressRetry,
  onPressReplyOriginal,
  onPressPeerAvatar,
  onEndReached,
  onEndReachedThreshold,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle,
}: ChatThreadProps) {
  const items = useMemo(() => buildChatListItems(messages), [messages]);

  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatListItem;
    index: number;
  }) => {
    if (item.kind === 'separator') {
      return <DaySeparatorItem label={item.label} />;
    }
    // FlatList is inverted, so items[0] renders at the bottom. Chronological neighbours:
    //   previousMessage (older, rendered above) = items[index + 1]
    //   nextMessage (newer, rendered below)     = items[index - 1]
    const olderItem = items[index + 1];
    const newerItem = items[index - 1];
    const previousMessage =
      olderItem && olderItem.kind === 'message' ? olderItem.message : null;
    const nextMessage =
      newerItem && newerItem.kind === 'message' ? newerItem.message : null;

    const isOwn = item.message.senderId === currentUserId;
    const replyOriginalId = messageReplyTo[item.message.id];
    const replyOriginal = replyOriginalId
      ? messageById.get(replyOriginalId)
      : null;
    const replyTo = replyOriginal
      ? {
          author: isReplyAuthorMe(replyOriginal, currentUserId)
            ? 'Você'
            : (replyOriginal.senderName.split(' ')[0] ??
              replyOriginal.senderName),
          text: replyOriginal.content ?? '',
        }
      : undefined;

    if (isOwn) {
      return (
        <OwnBubble
          message={item.message}
          status={messageStatuses[item.message.id]}
          previousMessage={previousMessage}
          nextMessage={nextMessage}
          replyTo={replyTo}
          onRetry={onPressRetry ? () => onPressRetry(item.message.id) : undefined}
          onPressReply={
            replyOriginal && onPressReplyOriginal
              ? () => onPressReplyOriginal(replyOriginal.id)
              : undefined
          }
          onSwipeReply={
            onSwipeReply ? () => onSwipeReply(item.message.id) : undefined
          }
        />
      );
    }
    return (
      <PeerBubble
        message={item.message}
        showSenderName={showPeerSenderName}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
        replyTo={replyTo}
        onPressAvatar={
          onPressPeerAvatar
            ? () => onPressPeerAvatar(item.message.senderId)
            : undefined
        }
        onPressReply={
          replyOriginal && onPressReplyOriginal
            ? () => onPressReplyOriginal(replyOriginal.id)
            : undefined
        }
        onSwipeReply={
          onSwipeReply ? () => onSwipeReply(item.message.id) : undefined
        }
      />
    );
  };

  return (
    <FlatList
      inverted
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      contentContainerStyle={contentContainerStyle ?? chatStyles.threadContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={showTypingBubble ? <TypingBubble /> : null}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

function isReplyAuthorMe(message: ChatMessage, currentUserId: string): boolean {
  return message.senderId === currentUserId;
}
