// src/application/hooks/useGroupChat/useGroupChat.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type ChatMessageReplyTo,
  type GroupMessage,
  type GroupMessageHistoryResponse,
  type MessageDeleted,
  type MessageEdited,
  type PresenceUpdate,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { User } from '@/domain/user.entity';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { messagesApi } from '@/infra/api/messages.api';
import { markPushMessageSeen } from '@/infra/notifications/push-notifications';
import {
  getLocalSendStatus,
  type ChatMessageWithSendStatus,
  type ChatSendStatus,
} from '@/shared/chat/sendStatus';
import {
  createSendTimeoutTracker,
  markTempAsError,
} from '@/shared/chat/sendStatusTracker';
import { removeGroupMessageById } from '../useDeleteGroupMessage/useDeleteGroupMessage';
import { applyEditedToGroupMessage } from '../useEditGroupMessage/useEditGroupMessage';
import type { GroupSummaryUpdate } from '@/infra/api/groups.api';
import {
  applyGroupSummaryUpdate,
  markMyGroupReadInCaches,
  MY_GROUPS_KEY,
} from '../useMyGroups/useMyGroups';

export type ChatErrorKind = 'load_failed' | 'socket_error';
export type GroupMessageStatus = ChatSendStatus;
type GroupMessageWithSendStatus = ChatMessageWithSendStatus<GroupMessage>;

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

export const chatHistoryKey = (groupId: string) =>
  ['chat', 'history', groupId] as const;

const MARK_READ_ACK_TIMEOUT_MS = 4_000;

function upsertIncomingMessage(
  old: InfiniteData<GroupMessageHistoryResponse> | undefined,
  message: GroupMessage,
): InfiniteData<GroupMessageHistoryResponse> | undefined {
  if (!old) return old;
  const already = old.pages.some((p) =>
    p.data.some((m) => m.id === message.id),
  );
  if (already) return old;

  const [first, ...rest] = old.pages;
  if (!first) return old;

  const tempIdx =
    message.clientMessageId !== null
      ? first.data.findIndex(
          (m) =>
            m.id.startsWith('temp-') &&
            m.clientMessageId === message.clientMessageId,
        )
      : -1;
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
  old: InfiniteData<GroupMessageHistoryResponse> | undefined,
  message: GroupMessage,
): InfiniteData<GroupMessageHistoryResponse> | undefined {
  if (!old) return old;
  const [first, ...rest] = old.pages;
  if (!first) return old;

  return {
    ...old,
    pages: [{ ...first, data: [message, ...first.data] }, ...rest],
  };
}

function createOptimisticMessage(
  user: User,
  content: string,
  replyTo: ChatMessageReplyTo | null = null,
): GroupMessageWithSendStatus {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: tempId,
    clientMessageId: tempId,
    sendStatus: 'sending',
    senderId: user.id,
    senderName: user.displayName,
    senderAvatarUrl: user.avatarUrl,
    content,
    mediaUrl: null,
    mediaType: null,
    createdAt: new Date().toISOString(),
    replyTo,
    isDeleted: false,
    editedAt: null,
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
 * Owns a single group's chat history (React Query) and wires its live events
 * into the app-level chat socket via the manager. The manager owns connection
 * lifecycle; this hook only adds listeners, ref-counts the group room, and
 * emits sends + mark-read.
 */
export function useGroupChat(groupId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const manager = useChatSocketManager();

  const [onlineCount, setOnlineCount] = useState(0);
  const [socketError, setSocketError] = useState<ChatErrorKind | null>(null);
  const trackerRef = useRef(createSendTimeoutTracker()).current;

  const isJoining =
    useIsMutating({
      mutationKey: ['join-group'],
      predicate: (m) =>
        (m.state.variables as { groupId?: string } | undefined)?.groupId ===
        groupId,
    }) > 0;

  const historyQuery = useInfiniteQuery<
    GroupMessageHistoryResponse,
    Error,
    InfiniteData<GroupMessageHistoryResponse>,
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

  const messages = useMemo<GroupMessageWithSendStatus[]>(
    () => historyQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [historyQuery.data],
  );

  const currentUserId = currentUser?.id ?? null;

  const messageStatuses = useMemo<Record<string, GroupMessageStatus>>(() => {
    if (!currentUserId) return {};
    const out: Record<string, GroupMessageStatus> = {};
    for (const m of messages) {
      if (m.senderId !== currentUserId) continue;
      out[m.id] = m.id.startsWith('temp-')
        ? (getLocalSendStatus(m) ?? 'sending')
        : 'sent';
    }
    return out;
  }, [messages, currentUserId]);

  const historyReady = !historyQuery.isLoading && !historyQuery.isError;

  const markGroupRead = useCallback(() => {
    markMyGroupReadInCaches(queryClient, groupId);

    manager.emitWithAck(
      ChatSocketEvents.MARK_GROUP_READ,
      { groupId },
      MARK_READ_ACK_TIMEOUT_MS,
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
  }, [groupId, queryClient, manager]);

  useEffect(() => {
    if (!accessToken) return;
    if (isJoining) return;
    if (!historyReady) return;

    const handleNewMessage = (message: GroupMessage) => {
      if (message.clientMessageId) {
        trackerRef.clear(message.clientMessageId);
      }
      markPushMessageSeen(message.id);
      queryClient.setQueryData<InfiniteData<GroupMessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => upsertIncomingMessage(old, message),
      );
      markGroupRead();
    };

    const handlePresenceUpdate = (payload: PresenceUpdate) => {
      if (payload.groupId !== groupId) return;
      setOnlineCount(payload.count);
    };

    const handleMessageDeleted = (payload: MessageDeleted) => {
      if (payload.groupId !== groupId) return;
      queryClient.setQueryData<InfiniteData<GroupMessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => removeGroupMessageById(old, payload.messageId),
      );
    };

    const handleMessageEdited = (payload: MessageEdited) => {
      if (payload.groupId !== groupId) return;
      queryClient.setQueryData<InfiniteData<GroupMessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) =>
          applyEditedToGroupMessage(old, {
            messageId: payload.messageId,
            content: payload.content,
            editedAt: payload.editedAt,
          }),
      );
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      setSocketError('socket_error');
      // eslint-disable-next-line no-console
      console.warn('[chat] socket error', payload);
    };

    const offNew = manager.addListener<GroupMessage>(
      ChatSocketEvents.NEW_MESSAGE,
      handleNewMessage,
    );
    const offDeleted = manager.addListener<MessageDeleted>(
      ChatSocketEvents.MESSAGE_DELETED,
      handleMessageDeleted,
    );
    const offEdited = manager.addListener<MessageEdited>(
      ChatSocketEvents.MESSAGE_EDITED,
      handleMessageEdited,
    );
    const offPresence = manager.addListener<PresenceUpdate>(
      ChatSocketEvents.PRESENCE_UPDATE,
      handlePresenceUpdate,
    );
    const offError = manager.addListener<SocketErrorPayload>(
      ChatSocketEvents.ERROR,
      handleSocketError,
    );

    const offJoin = manager.subscribe({
      key: `group:join:${groupId}`,
      subscribe: () => {
        manager.emit(ChatSocketEvents.JOIN_GROUP, { groupId });
        markGroupRead();
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.LEAVE_GROUP, { groupId });
      },
    });

    return () => {
      offNew();
      offDeleted();
      offEdited();
      offPresence();
      offError();
      offJoin();
      trackerRef.clearAll();
      setOnlineCount(0);
    };
  }, [
    groupId,
    accessToken,
    queryClient,
    historyReady,
    isJoining,
    markGroupRead,
    manager,
  ]);

  const sendMessage = useCallback(
    (input: { content: string; replyTo?: ChatMessageReplyTo | null }) => {
      const trimmed = input.content.trim();
      if (!trimmed) return;
      if (!currentUser) return;

      const replyTo = input.replyTo ?? null;
      const temp = createOptimisticMessage(currentUser, trimmed, replyTo);
      queryClient.setQueryData<InfiniteData<GroupMessageHistoryResponse>>(
        chatHistoryKey(groupId),
        (old) => prependTempMessage(old, temp),
      );

      const clientMessageId = temp.clientMessageId ?? temp.id;
      manager.emit(ChatSocketEvents.SEND_MESSAGE, {
        groupId,
        content: trimmed,
        storageKey: null,
        mediaType: null,
        clientMessageId,
        replyToMessageId: replyTo?.id ?? null,
      });

      trackerRef.track(clientMessageId, (cid) => {
        queryClient.setQueryData<InfiniteData<GroupMessageHistoryResponse>>(
          chatHistoryKey(groupId),
          (old) => markTempAsError(old, cid),
        );
      });
    },
    [groupId, currentUser, queryClient, manager, trackerRef],
  );

  const loadOlder = useCallback(() => {
    if (!historyQuery.hasNextPage || historyQuery.isFetchingNextPage) return;
    historyQuery.fetchNextPage();
  }, [historyQuery]);

  return {
    messages,
    messageStatuses,
    loading: historyQuery.isLoading || isJoining,
    loadingMore: historyQuery.isFetchingNextPage,
    error: historyQuery.isError ? ('load_failed' as const) : socketError,
    connected: manager.connected,
    onlineCount,
    hasMore: historyQuery.hasNextPage ?? false,
    currentUserId,
    sendMessage,
    loadOlder,
  };
}
