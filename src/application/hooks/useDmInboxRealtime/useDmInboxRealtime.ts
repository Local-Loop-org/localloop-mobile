import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type DmSummaryUpdate,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { ChatMessage } from '@/infra/api/messages.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import {
  applyDmSummaryUpdate,
  DM_CONVERSATIONS_KEY,
} from '../useDmConversations/useDmConversations';

interface UseDmInboxRealtimeOptions {
  enabled?: boolean;
}

type SocketErrorPayload = {
  code?: string;
  message?: string;
};

type DmRequestAcceptedPayload = ChatMessage & {
  recipientId: string;
};

export function useDmInboxRealtime({
  enabled = true,
}: UseDmInboxRealtimeOptions = {}): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const socket = createChatSocket(accessToken);

    const handleConnect = () => {
      socket.emit(ChatSocketEvents.WATCH_DM_INBOX, {});
    };

    const handleSummaryUpdate = (payload: DmSummaryUpdate) => {
      applyDmSummaryUpdate(queryClient, payload);
    };

    const handleRequestAccepted = (_payload: DmRequestAcceptedPayload) => {
      void queryClient.invalidateQueries({ queryKey: DM_CONVERSATIONS_KEY });
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      // eslint-disable-next-line no-console
      console.warn('[dm-inbox-realtime] socket error', payload);
    };

    socket.on('connect', handleConnect);
    socket.on(ChatSocketEvents.DM_SUMMARY_UPDATE, handleSummaryUpdate);
    socket.on(ChatSocketEvents.DM_REQUEST_ACCEPTED, handleRequestAccepted);
    socket.on(ChatSocketEvents.ERROR, handleSocketError);

    return () => {
      socket.emit(ChatSocketEvents.UNWATCH_DM_INBOX, {});
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [accessToken, enabled, queryClient]);
}
