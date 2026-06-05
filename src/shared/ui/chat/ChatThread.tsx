import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleProp, ViewStyle } from 'react-native';
import type { ChatMessage, ChatMessageReplyTo } from '@localloop/shared-types';
import {
  buildChatListItems,
  type ChatListItem,
} from '@/shared/format/chat';
import { OwnBubble, type OwnBubbleStatus } from './OwnBubble';
import { PeerBubble } from './PeerBubble';
import { DaySeparatorItem } from './DaySeparatorItem';
import { TypingBubble } from './TypingBubble';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

export interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId: string;

  /** Per-message status overrides, keyed by message id (own messages only). */
  messageStatuses?: Record<string, OwnBubbleStatus>;

  /** Group chat shows sender names on peer bubbles; DM hides them. */
  showPeerSenderName?: boolean;
  /** Render a typing bubble at the bottom of the list. */
  showTypingBubble?: boolean;

  // ── handlers (all optional) ──────────────────────────────────
  onSwipeReply?: (messageId: string) => void;
  onPressRetry?: (messageId: string) => void;
  onPressPeerAvatar?: (senderId: string) => void;
  onLongPressMessage?: (messageId: string) => void;

  // ── FlatList passthroughs ────────────────────────────────────
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const EMPTY_STATUSES: Record<string, OwnBubbleStatus> = {};

export function ChatThread({
  messages,
  currentUserId,
  messageStatuses = EMPTY_STATUSES,
  showPeerSenderName = false,
  showTypingBubble = false,
  onSwipeReply,
  onPressRetry,
  onPressPeerAvatar,
  onLongPressMessage,
  onEndReached,
  onEndReachedThreshold,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle,
}: ChatThreadProps) {
  const chatStyles = useThemedStyles(createStyles);
  const items = useMemo(() => buildChatListItems(messages), [messages]);

  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  const itemIndexByMessageId = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((it, idx) => {
      if (it.kind === 'message') map.set(it.message.id, idx);
    });
    return map;
  }, [items]);

  const listRef = useRef<FlatList<ChatListItem>>(null);

  const scrollToMessage = useCallback(
    (originalMessageId: string) => {
      const index = itemIndexByMessageId.get(originalMessageId);
      if (index === undefined) return;
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [itemIndexByMessageId],
  );

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 50);
    },
    [],
  );

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
    const replyToMeta = item.message.replyTo;
    const replyDisplay = replyToMeta
      ? resolveReplyDisplay(replyToMeta, messageById, currentUserId)
      : undefined;
    const replyTargetLoaded =
      replyToMeta !== null &&
      replyToMeta !== undefined &&
      !replyToMeta.isDeleted &&
      messageById.has(replyToMeta.id);

    if (isOwn) {
      return (
        <OwnBubble
          message={item.message}
          status={messageStatuses[item.message.id]}
          previousMessage={previousMessage}
          nextMessage={nextMessage}
          replyTo={replyDisplay}
          onRetry={onPressRetry ? () => onPressRetry(item.message.id) : undefined}
          onPressReply={
            replyTargetLoaded && replyToMeta
              ? () => scrollToMessage(replyToMeta.id)
              : undefined
          }
          onSwipeReply={
            onSwipeReply ? () => onSwipeReply(item.message.id) : undefined
          }
          onLongPress={
            onLongPressMessage
              ? () => onLongPressMessage(item.message.id)
              : undefined
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
        replyTo={replyDisplay}
        onPressAvatar={
          onPressPeerAvatar
            ? () => onPressPeerAvatar(item.message.senderId)
            : undefined
        }
        onPressReply={
          replyTargetLoaded && replyToMeta
            ? () => scrollToMessage(replyToMeta.id)
            : undefined
        }
        onSwipeReply={
          onSwipeReply ? () => onSwipeReply(item.message.id) : undefined
        }
        onLongPress={
          onLongPressMessage
            ? () => onLongPressMessage(item.message.id)
            : undefined
        }
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      inverted
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      contentContainerStyle={contentContainerStyle ?? chatStyles.threadContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      ListHeaderComponent={showTypingBubble ? <TypingBubble /> : null}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

function resolveReplyDisplay(
  replyTo: ChatMessageReplyTo,
  messageById: Map<string, ChatMessage>,
  currentUserId: string,
): { author: string; text: string } {
  if (replyTo.isDeleted) {
    return { author: 'Mensagem apagada', text: '' };
  }
  const parent = messageById.get(replyTo.id);
  if (parent?.isDeleted) {
    return { author: 'Mensagem apagada', text: '' };
  }
  if (parent) {
    const author =
      parent.senderId === currentUserId
        ? 'Você'
        : (parent.senderName.split(' ')[0] ?? parent.senderName);
    return { author, text: parent.content ?? '' };
  }
  const author = replyTo.authorId === currentUserId ? 'Você' : 'Mensagem';
  return { author, text: replyTo.snippet ?? '' };
}
