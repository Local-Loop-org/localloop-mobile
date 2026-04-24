// src/application/hooks/useGroupChat.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { ChatMessage, messagesApi } from '@/infra/api/messages.api';

export type ChatErrorKind = 'load_failed' | 'socket_error';

interface UseGroupChatState {
  messages: ChatMessage[];
  loading: boolean;
  loadingMore: boolean;
  error: ChatErrorKind | null;
  nextCursor: string | null;
  connected: boolean;
}

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

/**
 * Owns the lifecycle of a single group's chat: initial history fetch, the
 * Socket.IO connection, live `new_message` events, and `send_message` /
 * `load_older`. Disconnects on unmount. Callers (GroupChatScreen) render
 * `messages` newest-first (FlatList inverted).
 */
export function useGroupChat(groupId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const socketRef = useRef<Socket | null>(null);

  const [state, setState] = useState<UseGroupChatState>({
    messages: [],
    loading: true,
    loadingMore: false,
    error: null,
    nextCursor: null,
    connected: false,
  });

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const run = async () => {
      try {
        const history = await messagesApi.getHistory(groupId);
        if (cancelled) return;
        setState((s) => ({
          ...s,
          messages: history.data,
          nextCursor: history.next_cursor,
          loading: false,
        }));
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: 'load_failed' }));
        return;
      }

      const socket = createChatSocket(accessToken);
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_group', { groupId });
        if (!cancelled) setState((s) => ({ ...s, connected: true }));
      });
      socket.on('disconnect', () => {
        if (!cancelled) setState((s) => ({ ...s, connected: false }));
      });
      socket.on('new_message', (message: ChatMessage) => {
        if (cancelled) return;
        setState((s) => {
          if (s.messages.some((m) => m.id === message.id)) return s;
          return { ...s, messages: [message, ...s.messages] };
        });
      });
      socket.on('error', (payload: SocketErrorPayload) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          error: 'socket_error',
          // Retain the server-provided reason for diagnostics if needed.
        }));
        // eslint-disable-next-line no-console
        console.warn('[chat] socket error', payload);
      });
    };

    run();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('leave_group', { groupId });
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [groupId, accessToken]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit('send_message', {
        groupId,
        content: trimmed,
        storageKey: null,
        mediaType: null,
      });
    },
    [groupId],
  );

  const loadOlder = useCallback(async () => {
    setState((s) => {
      if (s.loadingMore || !s.nextCursor) return s;
      return { ...s, loadingMore: true };
    });
    const cursor = state.nextCursor;
    if (!cursor) return;
    try {
      const page = await messagesApi.getHistory(groupId, { before: cursor });
      setState((s) => ({
        ...s,
        messages: [...s.messages, ...page.data],
        nextCursor: page.next_cursor,
        loadingMore: false,
      }));
    } catch {
      setState((s) => ({ ...s, loadingMore: false, error: 'load_failed' }));
    }
  }, [groupId, state.nextCursor]);

  return {
    messages: state.messages,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    connected: state.connected,
    hasMore: state.nextCursor !== null,
    currentUserId,
    sendMessage,
    loadOlder,
  };
}
