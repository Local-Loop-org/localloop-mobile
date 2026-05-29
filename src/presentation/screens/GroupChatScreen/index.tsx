import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGroupChat } from '@/application/hooks/useGroupChat/useGroupChat';
import { useDeleteGroupMessage } from '@/application/hooks/useDeleteGroupMessage/useDeleteGroupMessage';
import GroupChatLayout from './layout';
import type { GroupChatScreenProps } from './types';
import { StackRoutes } from '@/presentation/navigation/routes';
import { groupPushConversationKey } from '@/infra/notifications/chat-push-data';
import {
  dismissPresentedNotificationsForConversation,
  setActivePushConversation,
} from '@/infra/notifications/push-notifications';
import type { GroupActionId } from '@/shared/ui/chat/GroupActionSheet';
import type { MessageActionId } from '@/shared/ui/chat/MessageActionSheet';
import {
  availableMessageActions,
  hasAnyAction,
} from '@/shared/ui/chat/messageActionPolicy';
import { truncateReplySnippet } from '@/shared/ui/chat/replySnippet';

interface ComposingReplyTarget {
  id: string;
  authorId: string;
  authorName: string;
  snippet: string;
}

const ERROR_LABEL: Record<string, string> = {
  load_failed: 'Não foi possível carregar o histórico.',
  socket_error: 'Erro de conexão com o chat.',
};

export default function GroupChatScreen({
  navigation,
  route,
}: GroupChatScreenProps) {
  const { groupId, groupName, anchorType, myRole } = route.params;
  const {
    messages,
    messageStatuses,
    loading,
    loadingMore,
    error,
    hasMore,
    onlineCount,
    currentUserId,
    sendMessage,
    loadOlder,
  } = useGroupChat(groupId);
  const deleteMessage = useDeleteGroupMessage();

  const [draft, setDraft] = useState('');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [messageActionTargetId, setMessageActionTargetId] = useState<
    string | null
  >(null);
  const [composingReplyTo, setComposingReplyTo] =
    useState<ComposingReplyTarget | null>(null);
  const conversationKey = groupPushConversationKey(groupId);

  useEffect(() => {
    const clearActiveConversation = setActivePushConversation(conversationKey);
    void dismissPresentedNotificationsForConversation(conversationKey).catch(
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[push] failed to dismiss group notifications', err);
      },
    );
    return clearActiveConversation;
  }, [conversationKey]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendMessage({
      content: trimmed,
      replyTo: composingReplyTo
        ? {
            id: composingReplyTo.id,
            authorId: composingReplyTo.authorId,
            snippet: composingReplyTo.snippet,
            isDeleted: false,
          }
        : null,
    });
    setDraft('');
    setComposingReplyTo(null);
  };

  const handlePressMessageAvatar = (message: (typeof messages)[number]) => {
    navigation.navigate(StackRoutes.DmChat, {
      peerId: message.senderId,
      peerName: message.senderName,
      peerAvatarUrl: message.senderAvatarUrl,
    });
  };

  const handlePressHeader = useCallback(() => {
    navigation.navigate(StackRoutes.GroupDetail, { groupId });
  }, [navigation, groupId]);

  const handlePressMembers = useCallback(() => {
    navigation.navigate(StackRoutes.GroupMembers, { groupId, myRole });
  }, [navigation, groupId, myRole]);

  const handleSelectAction = useCallback(
    (action: GroupActionId) => {
      setActionSheetOpen(false);
      if (action === 'details') handlePressHeader();
      else if (action === 'members') handlePressMembers();
      // mute / leave / report not wired yet — close only.
    },
    [handlePressHeader, handlePressMembers],
  );

  const targetMessage = useMemo(
    () =>
      messageActionTargetId
        ? (messages.find((m) => m.id === messageActionTargetId) ?? null)
        : null,
    [messages, messageActionTargetId],
  );

  const messageActionSheet = useMemo(() => {
    if (!targetMessage) return null;
    const available = availableMessageActions({
      message: targetMessage,
      currentUserId,
      conversation: 'group',
      myRole,
    });
    if (!hasAnyAction(available)) return null;
    return {
      messagePreview: targetMessage.content ?? '',
      available,
    };
  }, [targetMessage, currentUserId, myRole]);

  const handleLongPressMessage = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      const available = availableMessageActions({
        message: msg,
        currentUserId,
        conversation: 'group',
        myRole,
      });
      if (!hasAnyAction(available)) return;
      setMessageActionTargetId(messageId);
    },
    [messages, currentUserId, myRole],
  );

  const openReplyComposerFor = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const snippet = truncateReplySnippet(target.content);
      if (!snippet) return;
      setComposingReplyTo({
        id: target.id,
        authorId: target.senderId,
        authorName: target.senderName,
        snippet,
      });
    },
    [messages],
  );

  const handleSelectMessageAction = useCallback(
    (action: MessageActionId) => {
      const id = messageActionTargetId;
      setMessageActionTargetId(null);
      if (!id) return;
      if (action === 'delete') {
        deleteMessage.mutate({ groupId, messageId: id });
        return;
      }
      if (action === 'reply') {
        openReplyComposerFor(id);
      }
      // 'edit' wired in C13.
    },
    [messageActionTargetId, deleteMessage, groupId, openReplyComposerFor],
  );

  const composerReplyTo = useMemo(() => {
    if (!composingReplyTo) return null;
    const isMe = composingReplyTo.authorId === currentUserId;
    const firstName =
      composingReplyTo.authorName.split(' ')[0] ?? composingReplyTo.authorName;
    return {
      authorLabel: isMe ? 'Você' : firstName,
      originalText: composingReplyTo.snippet,
      onCancel: () => setComposingReplyTo(null),
    };
  }, [composingReplyTo, currentUserId]);

  return (
    <GroupChatLayout
      groupName={groupName}
      anchorType={anchorType}
      onlineCount={onlineCount}
      messages={messages}
      messageStatuses={messageStatuses}
      currentUserId={currentUserId}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      errorMessage={error ? ERROR_LABEL[error] : null}
      draft={draft}
      composingReplyTo={composerReplyTo}
      actionSheetOpen={actionSheetOpen}
      messageActionSheet={messageActionSheet}
      onChangeDraft={setDraft}
      onSend={handleSend}
      onLoadOlder={loadOlder}
      onPressMessageAvatar={handlePressMessageAvatar}
      onBack={() => navigation.goBack()}
      onPressHeader={handlePressHeader}
      onPressMore={() => setActionSheetOpen(true)}
      onCloseActionSheet={() => setActionSheetOpen(false)}
      onSelectAction={handleSelectAction}
      onLongPressMessage={handleLongPressMessage}
      onSwipeReply={openReplyComposerFor}
      onSelectMessageAction={handleSelectMessageAction}
      onCloseMessageActionSheet={() => setMessageActionTargetId(null)}
    />
  );
}
