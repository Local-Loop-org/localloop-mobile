import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ChatSocketEvents } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { User } from '@/domain/user.entity';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { dmApi } from '@/infra/api/dm.api';
import type {
  ChatMessage,
  MessageHistoryResponse,
} from '@/infra/api/messages.api';

export type DmChatErrorKind = 'load_failed' | 'socket_error';

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

const dmHistoryKey = (peerId: string) => ['dm', 'history', peerId] as const;

function upsertIncomingMessage(
  old: InfiniteData<MessageHistoryResponse> | undefined,
  message: ChatMessage,
): InfiniteData<MessageHistoryResponse> | undefined {
  if (!old) return old;
  const already = old.pages.some((p) =>
    p.data.some((m) => m.id === message.id),
  );
  if (already) return old;

  const [first, ...rest] = old.pages;
  if (!first) return old;

  const tempIdx = first.data.findIndex(
    (m) =>
      m.id.startsWith('temp-') &&
      m.senderId === message.senderId &&
      m.content === message.content,
  );
  const cleaned =
    tempIdx >= 0
      ? [...first.data.slice(0, tempIdx), ...first.data.slice(tempIdx + 1)]
      : first.data;

  return {
    ...old,
    pages: [{ ...first, data: [message, ...cleaned] }, ...rest],
  };
}

function prependTempMessage(
  old: InfiniteData<MessageHistoryResponse> | undefined,
  message: ChatMessage,
): InfiniteData<MessageHistoryResponse> | undefined {
  if (!old) return old;
  const [first, ...rest] = old.pages;
  if (!first) return old;

  return {
    ...old,
    pages: [{ ...first, data: [message, ...first.data] }, ...rest],
  };
}

function createOptimisticMessage(user: User, content: string): ChatMessage {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl,
    content,
    mediaUrl: null,
    mediaType: null,
    createdAt: new Date().toISOString(),
  };
}

export function useDmChat(peerId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<DmChatErrorKind | null>(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  const historyQuery = useInfiniteQuery<
    MessageHistoryResponse,
    Error,
    InfiniteData<MessageHistoryResponse>,
    ReturnType<typeof dmHistoryKey>,
    string | undefined
  >({
    queryKey: dmHistoryKey(peerId),
    queryFn: ({ pageParam }) =>
      dmApi.getDmHistory(peerId, pageParam ? { before: pageParam } : {}),
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

    const handleConnect = () => {
      socket.emit(ChatSocketEvents.JOIN_DM, { userId: peerId });
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleNewMessage = (
      payload: ChatMessage & { type?: string },
    ) => {
      if (payload.type === 'request') {
        queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
          dmHistoryKey(peerId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter((m) => !m.id.startsWith('temp-')),
              })),
            };
          },
        );
        setAwaitingApproval(true);
        return;
      }
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        dmHistoryKey(peerId),
        (old) => upsertIncomingMessage(old, payload),
      );
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      setSocketError('socket_error');
      // eslint-disable-next-line no-console
      console.warn('[dm-chat] socket error', payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(ChatSocketEvents.NEW_DIRECT_MESSAGE, handleNewMessage);
    socket.on(ChatSocketEvents.ERROR, handleSocketError);

    return () => {
      socket.emit(ChatSocketEvents.LEAVE_DM, { userId: peerId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [peerId, accessToken, queryClient, historyReady]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      if (!socket) return;
      if (!currentUser) return;

      const temp = createOptimisticMessage(currentUser, trimmed);
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        dmHistoryKey(peerId),
        (old) => prependTempMessage(old, temp),
      );

      socket.emit(ChatSocketEvents.SEND_DM, {
        recipientId: peerId,
        content: trimmed,
        mediaUrl: null,
        mediaType: null,
      });
    },
    [peerId, currentUser, queryClient],
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
    awaitingApproval,
    sendMessage,
    loadOlder,
  };
}
