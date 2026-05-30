import { useEffect, useMemo } from 'react';
import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type DirectMessage,
  type DirectMessageHistoryResponse,
  type DirectMessageStatus,
  type DmReadReceipt,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { getLocalSendStatus } from '@/shared/chat/sendStatus';
import {
  dmHistoryKey,
  fetchDmHistoryPage,
  getNextDmHistoryPageParam,
  setDmHistoryWatermark,
  type DmHistoryInfiniteData,
} from '../useDmHistory/dmHistoryQuery';

export interface UseDmReadStateResult {
  lastReadAt: string | null;
  peerLastReadAt: string | null;
  messageStatuses: Record<string, DirectMessageStatus>;
}

function isTempMessage(message: DirectMessage): boolean {
  return message.id.startsWith('temp-');
}

function isCoveredByPeerRead(
  message: DirectMessage,
  peerLastReadAt: string | null,
): boolean {
  if (!peerLastReadAt) return false;

  const messageTime = new Date(message.createdAt).getTime();
  const readTime = new Date(peerLastReadAt).getTime();

  if (Number.isNaN(messageTime) || Number.isNaN(readTime)) {
    return message.createdAt <= peerLastReadAt;
  }

  return messageTime <= readTime;
}

function buildMessageStatuses(
  messages: DirectMessage[],
  currentUserId: string | null,
  peerLastReadAt: string | null,
): Record<string, DirectMessageStatus> {
  if (!currentUserId) return {};

  return messages.reduce<Record<string, DirectMessageStatus>>((acc, message) => {
    if (message.senderId !== currentUserId) return acc;

    if (isTempMessage(message)) {
      acc[message.id] = getLocalSendStatus(message) ?? 'sending';
      return acc;
    }

    acc[message.id] = isCoveredByPeerRead(message, peerLastReadAt)
      ? 'read'
      : 'sent';
    return acc;
  }, {});
}

export function useDmReadState(peerId: string): UseDmReadStateResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();
  const manager = useChatSocketManager();

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
    enabled: !!accessToken && peerId.length > 0,
  });

  const firstPage = historyQuery.data?.pages[0];
  const lastReadAt = firstPage?.lastReadAt ?? null;
  const peerLastReadAt = firstPage?.peerLastReadAt ?? null;

  const messages = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [historyQuery.data],
  );

  const messageStatuses = useMemo(
    () => buildMessageStatuses(messages, currentUserId, peerLastReadAt),
    [messages, currentUserId, peerLastReadAt],
  );

  useEffect(() => {
    if (!currentUserId) return;
    if (peerId.length === 0) return;

    const handleReadReceipt = (payload: DmReadReceipt) => {
      if (payload.readerId === peerId && payload.peerId === currentUserId) {
        queryClient.setQueryData<DmHistoryInfiniteData>(
          dmHistoryKey(peerId),
          (old) =>
            setDmHistoryWatermark(old, 'peerLastReadAt', payload.lastReadAt),
        );
        return;
      }

      if (payload.readerId === currentUserId && payload.peerId === peerId) {
        queryClient.setQueryData<DmHistoryInfiniteData>(
          dmHistoryKey(peerId),
          (old) => setDmHistoryWatermark(old, 'lastReadAt', payload.lastReadAt),
        );
      }
    };

    return manager.addListener<DmReadReceipt>(
      ChatSocketEvents.DM_READ_RECEIPT,
      handleReadReceipt,
    );
  }, [currentUserId, manager, peerId, queryClient]);

  return {
    lastReadAt,
    peerLastReadAt,
    messageStatuses,
  };
}
