import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type ChatMessageReplyTo,
  type DirectMessage,
  type DirectMessageDeleted,
  type DirectMessageEdited,
  type DirectMessageHistoryResponse,
  type DmSummaryUpdate,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { User } from '@/domain/user.entity';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { markPushMessageSeen } from '@/infra/notifications/push-notifications';
import type { ChatMessageWithSendStatus } from '@/shared/chat/sendStatus';
import {
  createSendTimeoutTracker,
  markTempAsError,
} from '@/shared/chat/sendStatusTracker';
import {
  applyDmSummaryUpdate,
  DM_CONVERSATIONS_KEY,
  markDmReadInCaches,
} from '../useDmConversations/useDmConversations';
import {
  dmHistoryKey,
  fetchDmHistoryPage,
  getNextDmHistoryPageParam,
  type DmHistoryInfiniteData,
} from '../useDmHistory/dmHistoryQuery';
import { markDirectMessageDeleted } from '../useDeleteDirectMessage/useDeleteDirectMessage';
import { applyEditedToDirectMessage } from '../useEditDirectMessage/useEditDirectMessage';

export type DmChatErrorKind = 'load_failed' | 'socket_error';

interface SocketErrorPayload {
  code?: string;
  message?: string;
}

interface DmRequestSentPayload {
  requestId: string;
}

type DmRequestAcceptedPayload = DirectMessage;
type DirectMessageWithSendStatus = ChatMessageWithSendStatus<DirectMessage>;

function upsertIncomingMessage(
  old: DmHistoryInfiniteData | undefined,
  message: DirectMessage,
): DmHistoryInfiniteData | undefined {
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
  old: DmHistoryInfiniteData | undefined,
  message: DirectMessage,
): DmHistoryInfiniteData | undefined {
  if (!old) return old;
  const [first, ...rest] = old.pages;
  if (!first) return old;

  return {
    ...old,
    pages: [{ ...first, data: [message, ...first.data] }, ...rest],
  };
}

function removeTempMessages(
  old: DmHistoryInfiniteData | undefined,
): DmHistoryInfiniteData | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: page.data.filter((m) => !m.id.startsWith('temp-')),
    })),
  };
}

function createOptimisticMessage(
  user: User,
  peerId: string,
  content: string,
  replyTo: ChatMessageReplyTo | null = null,
): DirectMessageWithSendStatus {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: tempId,
    clientMessageId: tempId,
    sendStatus: 'sending',
    senderId: user.id,
    senderName: user.displayName,
    senderAvatarUrl: user.avatarUrl,
    recipientId: peerId,
    content,
    mediaUrl: null,
    mediaType: null,
    createdAt: new Date().toISOString(),
    replyTo,
    isDeleted: false,
    editedAt: null,
  };
}

function messageBelongsToPeer(
  message: DirectMessage,
  peerId: string,
  currentUserId: string | null,
): boolean {
  if (message.senderId === peerId) return true;
  if (message.recipientId === peerId) return true;
  if (message.recipientId) return false;
  return !!currentUserId && message.senderId === currentUserId;
}

export function useDmChat(peerId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const manager = useChatSocketManager();

  const [socketError, setSocketError] = useState<DmChatErrorKind | null>(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const trackerRef = useRef(createSendTimeoutTracker()).current;

  const historyQuery = useInfiniteQuery<
    DirectMessageHistoryResponse,
    Error,
    InfiniteData<DirectMessageHistoryResponse>,
    ReturnType<typeof dmHistoryKey>,
    string | undefined
  >({
    queryKey: dmHistoryKey(peerId),
    queryFn: ({ pageParam }) => fetchDmHistoryPage(peerId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: getNextDmHistoryPageParam,
    enabled: !!accessToken,
  });

  const messages = useMemo<DirectMessageWithSendStatus[]>(
    () => historyQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [historyQuery.data],
  );

  const historyReady = !historyQuery.isLoading && !historyQuery.isError;

  const markDmRead = useCallback(() => {
    markDmReadInCaches(queryClient, peerId);
    manager.emit(ChatSocketEvents.MARK_DM_READ, { peerId });
  }, [peerId, queryClient, manager]);

  useEffect(() => {
    if (!accessToken) return;
    if (!historyReady) return;

    const currentUserId = currentUser?.id ?? null;

    const handleNewMessage = (payload: DirectMessage & { type?: string }) => {
      if (payload.type === 'request') {
        trackerRef.clearAll();
        queryClient.setQueryData<DmHistoryInfiniteData>(
          dmHistoryKey(peerId),
          removeTempMessages,
        );
        setAwaitingApproval(true);
        return;
      }
      if (payload.clientMessageId) {
        trackerRef.clear(payload.clientMessageId);
      }
      markPushMessageSeen(payload.id);
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) => upsertIncomingMessage(old, payload),
      );
      if (payload.senderId !== currentUserId) {
        markDmRead();
      }
    };

    const handleRequestSent = (_payload: DmRequestSentPayload) => {
      trackerRef.clearAll();
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        removeTempMessages,
      );
      setAwaitingApproval(true);
    };

    const handleRequestAccepted = (payload: DmRequestAcceptedPayload) => {
      if (!messageBelongsToPeer(payload, peerId, currentUserId)) {
        return;
      }
      markPushMessageSeen(payload.id);
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) => upsertIncomingMessage(old, payload),
      );
      setAwaitingApproval(false);
      void queryClient.invalidateQueries({ queryKey: DM_CONVERSATIONS_KEY });
    };

    const handleSummaryUpdate = (payload: DmSummaryUpdate) => {
      applyDmSummaryUpdate(queryClient, payload);
    };

    const handleDirectMessageDeleted = (payload: DirectMessageDeleted) => {
      // Scope filter: ignore deletes for unrelated DM threads.
      if (payload.senderId !== peerId && payload.recipientId !== peerId) return;
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) => markDirectMessageDeleted(old, payload.messageId),
      );
    };

    const handleDirectMessageEdited = (payload: DirectMessageEdited) => {
      if (payload.senderId !== peerId && payload.recipientId !== peerId) return;
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) =>
          applyEditedToDirectMessage(old, {
            messageId: payload.messageId,
            content: payload.content,
            editedAt: payload.editedAt,
          }),
      );
    };

    const handleSocketError = (payload: SocketErrorPayload) => {
      setSocketError('socket_error');
      // eslint-disable-next-line no-console
      console.warn('[dm-chat] socket error', payload);
    };

    const offNew = manager.addListener<DirectMessage & { type?: string }>(
      ChatSocketEvents.NEW_DIRECT_MESSAGE,
      handleNewMessage,
    );
    const offDeleted = manager.addListener<DirectMessageDeleted>(
      ChatSocketEvents.DIRECT_MESSAGE_DELETED,
      handleDirectMessageDeleted,
    );
    const offEdited = manager.addListener<DirectMessageEdited>(
      ChatSocketEvents.DIRECT_MESSAGE_EDITED,
      handleDirectMessageEdited,
    );
    const offRequestSent = manager.addListener<DmRequestSentPayload>(
      ChatSocketEvents.DM_REQUEST_SENT,
      handleRequestSent,
    );
    const offRequestAccepted = manager.addListener<DmRequestAcceptedPayload>(
      ChatSocketEvents.DM_REQUEST_ACCEPTED,
      handleRequestAccepted,
    );
    const offSummary = manager.addListener<DmSummaryUpdate>(
      ChatSocketEvents.DM_SUMMARY_UPDATE,
      handleSummaryUpdate,
    );
    const offError = manager.addListener<SocketErrorPayload>(
      ChatSocketEvents.ERROR,
      handleSocketError,
    );

    const offJoin = manager.subscribe({
      key: `dm:join:${peerId}`,
      subscribe: () => {
        manager.emit(ChatSocketEvents.JOIN_DM, { userId: peerId });
        markDmRead();
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.LEAVE_DM, { userId: peerId });
      },
    });

    const offInbox = manager.subscribe({
      key: 'dm:inbox',
      subscribe: () => {
        manager.emit(ChatSocketEvents.WATCH_DM_INBOX, {});
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.UNWATCH_DM_INBOX, {});
      },
    });

    return () => {
      offNew();
      offDeleted();
      offEdited();
      offRequestSent();
      offRequestAccepted();
      offSummary();
      offError();
      offJoin();
      offInbox();
      trackerRef.clearAll();
    };
  }, [
    peerId,
    accessToken,
    queryClient,
    historyReady,
    currentUser?.id,
    markDmRead,
    manager,
  ]);

  const sendMessage = useCallback(
    (input: { content: string; replyTo?: ChatMessageReplyTo | null }) => {
      const trimmed = input.content.trim();
      if (!trimmed) return;
      if (!currentUser) return;

      const replyTo = input.replyTo ?? null;
      const temp = createOptimisticMessage(currentUser, peerId, trimmed, replyTo);
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) => prependTempMessage(old, temp),
      );

      const clientMessageId = temp.clientMessageId ?? temp.id;
      manager.emit(ChatSocketEvents.SEND_DM, {
        recipientId: peerId,
        content: trimmed,
        mediaUrl: null,
        mediaType: null,
        clientMessageId,
        replyToMessageId: replyTo?.id ?? null,
      });

      trackerRef.track(clientMessageId, (cid) => {
        queryClient.setQueryData<DmHistoryInfiniteData>(
          dmHistoryKey(peerId),
          (old) => markTempAsError(old, cid),
        );
      });
    },
    [peerId, currentUser, queryClient, manager, trackerRef],
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
    connected: manager.connected,
    hasMore: historyQuery.hasNextPage ?? false,
    currentUserId: currentUser?.id ?? null,
    awaitingApproval,
    sendMessage,
    loadOlder,
  };
}
