import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type DirectMessage,
  type DmSummaryUpdate,
} from '@localloop/shared-types';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
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

type DmRequestAcceptedPayload = DirectMessage;

export function useDmInboxRealtime({
  enabled = true,
}: UseDmInboxRealtimeOptions = {}): void {
  const manager = useChatSocketManager();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

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

    const offSummary = manager.addListener<DmSummaryUpdate>(
      ChatSocketEvents.DM_SUMMARY_UPDATE,
      handleSummaryUpdate,
    );
    const offAccepted = manager.addListener<DmRequestAcceptedPayload>(
      ChatSocketEvents.DM_REQUEST_ACCEPTED,
      handleRequestAccepted,
    );
    const offError = manager.addListener<SocketErrorPayload>(
      ChatSocketEvents.ERROR,
      handleSocketError,
    );

    const offSubscription = manager.subscribe({
      key: 'dm:inbox',
      subscribe: () => {
        manager.emit(ChatSocketEvents.WATCH_DM_INBOX, {});
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.UNWATCH_DM_INBOX, {});
      },
    });

    return () => {
      offSummary();
      offAccepted();
      offError();
      offSubscription();
    };
  }, [manager, enabled, queryClient]);
}
