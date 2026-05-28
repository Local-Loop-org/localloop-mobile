import React, { useCallback, useEffect, useState } from 'react';
import { useGroupChat } from '@/application/hooks/useGroupChat/useGroupChat';
import GroupChatLayout from './layout';
import type { GroupChatScreenProps } from './types';
import { StackRoutes } from '@/presentation/navigation/routes';
import { groupPushConversationKey } from '@/infra/notifications/chat-push-data';
import {
  dismissPresentedNotificationsForConversation,
  setActivePushConversation,
} from '@/infra/notifications/push-notifications';
import type { GroupActionId } from '@/shared/ui/chat/GroupActionSheet';

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

  const [draft, setDraft] = useState('');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
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
    sendMessage(trimmed);
    setDraft('');
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
      actionSheetOpen={actionSheetOpen}
      onChangeDraft={setDraft}
      onSend={handleSend}
      onLoadOlder={loadOlder}
      onPressMessageAvatar={handlePressMessageAvatar}
      onBack={() => navigation.goBack()}
      onPressHeader={handlePressHeader}
      onPressMore={() => setActionSheetOpen(true)}
      onCloseActionSheet={() => setActionSheetOpen(false)}
      onSelectAction={handleSelectAction}
    />
  );
}
