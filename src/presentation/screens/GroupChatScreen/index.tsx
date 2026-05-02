import React, { useState } from 'react';
import { useGroupChat } from '@/application/hooks/useGroupChat';
import GroupChatLayout from './layout';
import type { GroupChatScreenProps } from './types';

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
    loading,
    loadingMore,
    error,
    hasMore,
    onlineCount,
    currentUserId,
    sendMessage,
    loadOlder,
  } = useGroupChat(groupId);

  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setDraft('');
  };

  return (
    <GroupChatLayout
      groupName={groupName}
      anchorType={anchorType}
      onlineCount={onlineCount}
      messages={messages}
      currentUserId={currentUserId}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      errorMessage={error ? ERROR_LABEL[error] : null}
      draft={draft}
      onChangeDraft={setDraft}
      onSend={handleSend}
      onLoadOlder={loadOlder}
      onBack={() => navigation.goBack()}
      onPressHeader={() => navigation.navigate('GroupDetail', { groupId })}
      onPressMembers={() =>
        navigation.navigate('GroupMembers', { groupId, myRole })
      }
    />
  );
}
