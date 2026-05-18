import React, { useState } from 'react';
import DmChatLayout from './layout';
import { useDmChat } from '@/application/hooks/useDmChat/useDmChat';
import type { DmChatScreenProps } from './types';

const ERROR_LABELS: Record<string, string> = {
  load_failed: 'Falha ao carregar mensagens',
  socket_error: 'Erro na conexão',
};

export default function DmChatScreen({ route, navigation }: DmChatScreenProps) {
  const { peerId, peerName, peerAvatarUrl } = route.params;
  const [draft, setDraft] = useState('');

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

  const handleSend = () => {
    if (draft.trim().length === 0) return;
    sendMessage(draft);
    setDraft('');
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
    />
  );
}
