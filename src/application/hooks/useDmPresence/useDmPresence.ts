import { useEffect, useMemo, useState } from 'react';
import {
  ChatSocketEvents,
  type DmPresenceUpdate,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from '@/infra/socket/chat-socket';

export type DmPresenceStatus = { kind: 'online' } | null;

type SocketErrorPayload = {
  code?: string;
  message?: string;
};

export function useDmPresence(peerId: string): DmPresenceStatus {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    setOnline(false);

    if (!accessToken || peerId.length === 0) return;

    const socket = createChatSocket(accessToken);

    const handleConnect = () => {
      socket.emit(ChatSocketEvents.WATCH_DM_PRESENCE, { peerId });
    };

    const handlePresenceUpdate = (payload: DmPresenceUpdate) => {
      if (payload.peerId !== peerId) return;
      setOnline(payload.online);
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      // eslint-disable-next-line no-console
      console.warn('[dm-presence] socket error', payload);
    };

    socket.on('connect', handleConnect);
    socket.on(ChatSocketEvents.DM_PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(ChatSocketEvents.ERROR, handleSocketError);

    return () => {
      socket.emit(ChatSocketEvents.UNWATCH_DM_PRESENCE, { peerId });
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [accessToken, peerId]);

  return useMemo(() => (online ? { kind: 'online' } : null), [online]);
}
