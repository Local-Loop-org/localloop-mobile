import { useEffect, useMemo, useState } from 'react';
import {
  ChatSocketEvents,
  type DmPresenceUpdate,
} from '@localloop/shared-types';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';

export type DmPresenceStatus = { kind: 'online' } | null;

type SocketErrorPayload = {
  code?: string;
  message?: string;
};

export function useDmPresence(peerId: string): DmPresenceStatus {
  const manager = useChatSocketManager();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    setOnline(false);
    if (peerId.length === 0) return;

    const handlePresenceUpdate = (payload: DmPresenceUpdate) => {
      if (payload.peerId !== peerId) return;
      setOnline(payload.online);
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      // eslint-disable-next-line no-console
      console.warn('[dm-presence] socket error', payload);
    };

    const offPresence = manager.addListener<DmPresenceUpdate>(
      ChatSocketEvents.DM_PRESENCE_UPDATE,
      handlePresenceUpdate,
    );
    const offError = manager.addListener<SocketErrorPayload>(
      ChatSocketEvents.ERROR,
      handleSocketError,
    );

    const offSubscription = manager.subscribe({
      key: `dm:presence:${peerId}`,
      subscribe: () => {
        manager.emit(ChatSocketEvents.WATCH_DM_PRESENCE, { peerId });
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.UNWATCH_DM_PRESENCE, { peerId });
      },
    });

    return () => {
      offPresence();
      offError();
      offSubscription();
    };
  }, [manager, peerId]);

  return useMemo(() => (online ? { kind: 'online' } : null), [online]);
}
