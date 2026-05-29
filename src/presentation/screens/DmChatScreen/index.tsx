import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DmChatLayout from './layout';
import type { DmActionId } from '@/shared/ui/chat/DmActionSheet';
import type { MessageActionId } from '@/shared/ui/chat/MessageActionSheet';
import {
  availableMessageActions,
  hasAnyAction,
} from '@/shared/ui/chat/messageActionPolicy';
import { truncateReplySnippet } from '@/shared/ui/chat/replySnippet';
import { useArchiveDmConversation } from '@/application/hooks/useArchiveDmConversation/useArchiveDmConversation';
import { useDeleteDirectMessage } from '@/application/hooks/useDeleteDirectMessage/useDeleteDirectMessage';
import { useDmChat } from '@/application/hooks/useDmChat/useDmChat';
import { useDmPresence } from '@/application/hooks/useDmPresence/useDmPresence';
import { useDmReadState } from '@/application/hooks/useDmReadState/useDmReadState';
import { useUnarchiveDmConversation } from '@/application/hooks/useUnarchiveDmConversation/useUnarchiveDmConversation';
import type { DmChatScreenProps } from './types';
import { dmPushConversationKey } from '@/infra/notifications/chat-push-data';
import {
  dismissPresentedNotificationsForConversation,
  setActivePushConversation,
} from '@/infra/notifications/push-notifications';

const ERROR_LABELS: Record<string, string> = {
  load_failed: 'Falha ao carregar mensagens',
  socket_error: 'Erro na conexão',
};

interface ComposingReplyTarget {
  id: string;
  authorId: string;
  authorName: string;
  snippet: string;
}

export default function DmChatScreen({ route, navigation }: DmChatScreenProps) {
  const {
    peerId,
    peerName,
    peerAvatarUrl,
    initialArchived = false,
  } = route.params;
  const [draft, setDraft] = useState('');
  const [archived, setArchived] = useState(initialArchived);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [messageActionTargetId, setMessageActionTargetId] = useState<
    string | null
  >(null);
  const [composingReplyTo, setComposingReplyTo] =
    useState<ComposingReplyTarget | null>(null);
  const archiveDm = useArchiveDmConversation();
  const unarchiveDm = useUnarchiveDmConversation();
  const deleteMessage = useDeleteDirectMessage();
  const peerStatus = useDmPresence(peerId);
  const { messageStatuses } = useDmReadState(peerId);
  const conversationKey = dmPushConversationKey(peerId);

  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    currentUserId,
    awaitingApproval,
    sendMessage,
    loadOlder,
  } = useDmChat(peerId);

  useEffect(() => {
    const clearActiveConversation = setActivePushConversation(conversationKey);
    void dismissPresentedNotificationsForConversation(conversationKey).catch(
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[push] failed to dismiss DM notifications', err);
      },
    );
    return clearActiveConversation;
  }, [conversationKey]);

  const handleSend = () => {
    if (draft.trim().length === 0) return;
    sendMessage({
      content: draft,
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

  const toggleArchived = useCallback(() => {
    const nextArchived = !archived;
    setArchived(nextArchived);
    const mutation = nextArchived ? archiveDm : unarchiveDm;
    mutation.mutate(peerId, {
      onError: () => {
        setArchived(!nextArchived);
        Alert.alert(
          'Erro',
          nextArchived
            ? 'Não foi possível arquivar a conversa.'
            : 'Não foi possível desarquivar a conversa.',
        );
      },
    });
  }, [archived, archiveDm, peerId, unarchiveDm]);

  const handlePressMore = () => {
    if (archiveDm.isPending || unarchiveDm.isPending) return;
    setActionSheetOpen(true);
  };

  const handleSelectAction = useCallback(
    (action: DmActionId) => {
      setActionSheetOpen(false);
      if (action === 'archive') toggleArchived();
      // profile / mute / clear / block / report not wired yet — close only.
    },
    [toggleArchived],
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
      conversation: 'dm',
    });
    if (!hasAnyAction(available)) return null;
    return {
      messagePreview: targetMessage.content ?? '',
      available,
    };
  }, [targetMessage, currentUserId]);

  const handleLongPressMessage = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      const available = availableMessageActions({
        message: msg,
        currentUserId,
        conversation: 'dm',
      });
      if (!hasAnyAction(available)) return;
      setMessageActionTargetId(messageId);
    },
    [messages, currentUserId],
  );

  const handleSelectMessageAction = useCallback(
    (action: MessageActionId) => {
      const id = messageActionTargetId;
      setMessageActionTargetId(null);
      if (!id) return;
      if (action === 'delete') {
        deleteMessage.mutate({ peerId, messageId: id });
        return;
      }
      if (action === 'reply') {
        const target = messages.find((m) => m.id === id);
        if (!target) return;
        const snippet = truncateReplySnippet(target.content);
        if (!snippet) return;
        setComposingReplyTo({
          id: target.id,
          authorId: target.senderId,
          authorName: target.senderName,
          snippet,
        });
      }
      // 'edit' wired in C13.
    },
    [messageActionTargetId, deleteMessage, peerId, messages],
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
    <DmChatLayout
      peerName={peerName}
      peerAvatarUrl={peerAvatarUrl}
      peerStatus={peerStatus}
      messages={messages}
      messageStatuses={messageStatuses}
      currentUserId={currentUserId}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      errorMessage={error ? ERROR_LABELS[error] : null}
      awaitingApproval={awaitingApproval}
      archived={archived}
      draft={draft}
      composingReplyTo={composerReplyTo}
      actionSheetOpen={actionSheetOpen}
      onChangeDraft={setDraft}
      onSend={handleSend}
      onLoadOlder={loadOlder}
      onBack={() => navigation.goBack()}
      onPressHeader={() => {
        // TODO(dm-m2): navigate to peer profile
      }}
      onPressMore={handlePressMore}
      onCloseActionSheet={() => setActionSheetOpen(false)}
      onSelectAction={handleSelectAction}
      onCancelRequest={() => {
        // TODO: cancel pending DM approval — no backend hook yet
      }}
      moreDisabled={archiveDm.isPending || unarchiveDm.isPending}
      messageActionSheet={messageActionSheet}
      onLongPressMessage={handleLongPressMessage}
      onSelectMessageAction={handleSelectMessageAction}
      onCloseMessageActionSheet={() => setMessageActionTargetId(null)}
    />
  );
}
