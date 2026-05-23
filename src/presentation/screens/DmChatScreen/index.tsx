import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import DmChatLayout from './layout';
import { useArchiveDmConversation } from '@/application/hooks/useArchiveDmConversation/useArchiveDmConversation';
import { useDmChat } from '@/application/hooks/useDmChat/useDmChat';
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

export default function DmChatScreen({ route, navigation }: DmChatScreenProps) {
  const {
    peerId,
    peerName,
    peerAvatarUrl,
    initialArchived = false,
  } = route.params;
  const [draft, setDraft] = useState('');
  const [archived, setArchived] = useState(initialArchived);
  const archiveDm = useArchiveDmConversation();
  const unarchiveDm = useUnarchiveDmConversation();
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
    sendMessage(draft);
    setDraft('');
  };

  const toggleArchived = () => {
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
  };

  const handlePressMore = () => {
    if (archiveDm.isPending || unarchiveDm.isPending) return;
    Alert.alert(peerName, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: archived ? 'Desarquivar' : 'Arquivar',
        onPress: toggleArchived,
      },
    ]);
  };

  return (
    <DmChatLayout
      peerName={peerName}
      peerAvatarUrl={peerAvatarUrl}
      peerStatus={null}
      messages={messages}
      currentUserId={currentUserId}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      errorMessage={error ? ERROR_LABELS[error] : null}
      awaitingApproval={awaitingApproval}
      draft={draft}
      onChangeDraft={setDraft}
      onSend={handleSend}
      onLoadOlder={loadOlder}
      onBack={() => navigation.goBack()}
      onPressHeader={() => {
        // TODO(dm-m2): navigate to peer profile
      }}
      onPressMore={handlePressMore}
      moreDisabled={archiveDm.isPending || unarchiveDm.isPending}
    />
  );
}
