// src/infra/socket/chat-socket.ts

import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/shared/constants';

/**
 * Creates a Socket.IO client pointed at the `/chat` namespace.
 * The JWT is passed via the handshake auth object; the gateway verifies it
 * on connection and disconnects otherwise. Callers own the socket lifecycle
 * (connect / disconnect).
 */
export function createChatSocket(accessToken: string): Socket {
  return io(`${API_URL}/chat`, {
    transports: ['websocket'],
    auth: { token: accessToken },
    autoConnect: true,
  });
}
