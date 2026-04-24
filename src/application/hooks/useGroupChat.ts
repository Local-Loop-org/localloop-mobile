// src/application/hooks/useGroupChat.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from '@/infra/socket/chat-socket';
import {
  ChatMessage,
  MessageHistoryResponse,
  messagesApi,
} from '@/infra/api/messages.api';

export type ChatErrorKind = 'load_failed' | 'socket_error';

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

const chatHistoryKey = (groupId: string) =>
  ['chat', 'history', groupId] as const;

/**
 * Owns the lifecycle of a single group's chat: history via React Query
 * (`useInfiniteQuery`), the Socket.IO connection, live `new_message` events,
 * and optimistic `send_message`. Server echoes reconcile with in-flight temps
 * via the same cache writer. Disconnects on unmount but keeps the query cache
 * warm so reopens within `gcTime` render instantly.
 */
export function useGroupChat(groupId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<ChatErrorKind | null>(null);

  const historyQuery = useInfiniteQuery<
    MessageHistoryResponse,
    Error,
    InfiniteData<MessageHistoryResponse>,
    ReturnType<typeof chatHistoryKey>,
    string | undefined
  >({
    queryKey: chatHistoryKey(groupId),
    queryFn: ({ pageParam }) =>
      messagesApi.getHistory(groupId, pageParam ? { before: pageParam } : {}),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: !!accessToken,
  });

  const messages = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [historyQuery.data],
  );

  const historyReady = !historyQuery.isLoading && !historyQuery.isError;

  useEffect(() => {
    if (!accessToken) return;
    if (!historyReady) return;

    const socket = createChatSocket(accessToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_group', { groupId });
      setConnected(true);
    });
    socket.on('disconnect', () => {
      setConnected(false);
    });
    socket.on('new_message', (message: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => {
          if (!old) return old;
          const already = old.pages.some((p) =>
            p.data.some((m) => m.id === message.id),
          );
          if (already) return old;
          const [first, ...rest] = old.pages;
          const tempIdx = first.data.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.senderId === message.senderId &&
              m.content === message.content,
          );
          const cleaned =
            tempIdx >= 0
              ? [
                  ...first.data.slice(0, tempIdx),
                  ...first.data.slice(tempIdx + 1),
                ]
              : first.data;
          return {
            ...old,
            pages: [{ ...first, data: [message, ...cleaned] }, ...rest],
          };
        },
      );
    });
    socket.on('error', (payload: SocketErrorPayload) => {
      setSocketError('socket_error');
      // eslint-disable-next-line no-console
      console.warn('[chat] socket error', payload);
    });

    return () => {
      socket.emit('leave_group', { groupId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [groupId, accessToken, queryClient, historyReady]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      if (!socket) return;
      if (!currentUser) return;

      const temp: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatar: currentUser.avatarUrl,
        content: trimmed,
        mediaUrl: null,
        mediaType: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => {
          if (!old) return old;
          const [first, ...rest] = old.pages;
          return {
            ...old,
            pages: [{ ...first, data: [temp, ...first.data] }, ...rest],
          };
        },
      );

      socket.emit('send_message', {
        groupId,
        content: trimmed,
        storageKey: null,
        mediaType: null,
      });
    },
    [groupId, currentUser, queryClient],
  );

  const loadOlder = useCallback(() => {
    if (!historyQuery.hasNextPage || historyQuery.isFetchingNextPage) return;
    historyQuery.fetchNextPage();
  }, [historyQuery]);

  return {
    messages,
    loading: historyQuery.isLoading,
    loadingMore: historyQuery.isFetchingNextPage,
    error: historyQuery.isError ? ('load_failed' as const) : socketError,
    connected,
    hasMore: historyQuery.hasNextPage ?? false,
    currentUserId: currentUser?.id ?? null,
    sendMessage,
    loadOlder,
  };
}
