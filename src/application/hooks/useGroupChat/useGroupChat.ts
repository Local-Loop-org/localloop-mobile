// src/application/hooks/useGroupChat/useGroupChat.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  InfiniteData,
  useInfiniteQuery,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query';
import { ChatSocketEvents, type PresenceUpdate } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { User } from '@/domain/user.entity';
import { createChatSocket } from '@/infra/socket/chat-socket';
import {
  ChatMessage,
  MessageHistoryResponse,
  messagesApi,
} from '@/infra/api/messages.api';
import type { GroupSummaryUpdate } from '@/infra/api/groups.api';
import {
  applyGroupSummaryUpdate,
  markMyGroupReadInCaches,
  MY_GROUPS_KEY,
} from '../useMyGroups/useMyGroups';

export type ChatErrorKind = 'load_failed' | 'socket_error';

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

const chatHistoryKey = (groupId: string) =>
  ['chat', 'history', groupId] as const;

const MARK_READ_ACK_TIMEOUT_MS = 4_000;

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

function isGroupSummaryUpdate(value: unknown): value is GroupSummaryUpdate {
  if (!value || typeof value !== 'object') return false;
  const summary = value as Partial<GroupSummaryUpdate>;
  return (
    typeof summary.groupId === 'string' &&
    typeof summary.lastActivityAt === 'string' &&
    'lastMessage' in summary &&
    ('lastReadAt' in summary
      ? summary.lastReadAt === null || typeof summary.lastReadAt === 'string'
      : false) &&
    typeof summary.unreadCount === 'number'
  );
}

function getAckSummary(payload: unknown): GroupSummaryUpdate | null {
  if (isGroupSummaryUpdate(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  const maybeWrapped = payload as { summary?: unknown };
  return isGroupSummaryUpdate(maybeWrapped.summary)
    ? maybeWrapped.summary
    : null;
}

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
  const [onlineCount, setOnlineCount] = useState(0);
  const [socketError, setSocketError] = useState<ChatErrorKind | null>(null);

  const isJoining =
    useIsMutating({
      mutationKey: ['join-group'],
      predicate: (m) =>
        (m.state.variables as { groupId?: string } | undefined)?.groupId ===
        groupId,
    }) > 0;

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
    enabled: !!accessToken && !isJoining,
  });

  const messages = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [historyQuery.data],
  );

  const historyReady = !historyQuery.isLoading && !historyQuery.isError;

  const markGroupRead = useCallback(
    (socket: Socket) => {
      markMyGroupReadInCaches(queryClient, groupId);

      socket
        .timeout(MARK_READ_ACK_TIMEOUT_MS)
        .emit(
          ChatSocketEvents.MARK_GROUP_READ,
          { groupId },
          (error: Error | null, payload?: unknown) => {
            if (error) {
              queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
              return;
            }

            const summary = getAckSummary(payload);
            if (!summary) {
              queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
              return;
            }

            applyGroupSummaryUpdate(queryClient, summary);
          },
        );
    },
    [groupId, queryClient],
  );

  useEffect(() => {
    if (!accessToken) return;
    if (isJoining) return;
    if (!historyReady) return;

    const socket = createChatSocket(accessToken);
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit(ChatSocketEvents.JOIN_GROUP, { groupId });
      markGroupRead(socket);
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleNewMessage = (message: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => upsertIncomingMessage(old, message),
      );
      markGroupRead(socket);
    };

    const handlePresenceUpdate = (payload: PresenceUpdate) => {
      if (payload.groupId !== groupId) return;
      setOnlineCount(payload.count);
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      setSocketError('socket_error');
      // eslint-disable-next-line no-console
      console.warn('[chat] socket error', payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(ChatSocketEvents.NEW_MESSAGE, handleNewMessage);
    socket.on(ChatSocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(ChatSocketEvents.ERROR, handleSocketError);

    return () => {
      socket.emit(ChatSocketEvents.LEAVE_GROUP, { groupId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setOnlineCount(0);
    };
  }, [
    groupId,
    accessToken,
    queryClient,
    historyReady,
    isJoining,
    markGroupRead,
  ]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      if (!socket) return;
      if (!currentUser) return;

      const temp = createOptimisticMessage(currentUser, trimmed);
      queryClient.setQueryData<InfiniteData<MessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => prependTempMessage(old, temp),
      );

      socket.emit(ChatSocketEvents.SEND_MESSAGE, {
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
    loading: historyQuery.isLoading || isJoining,
    loadingMore: historyQuery.isFetchingNextPage,
    error: historyQuery.isError ? ('load_failed' as const) : socketError,
    connected,
    onlineCount,
    hasMore: historyQuery.hasNextPage ?? false,
    currentUserId: currentUser?.id ?? null,
    sendMessage,
    loadOlder,
  };
}
