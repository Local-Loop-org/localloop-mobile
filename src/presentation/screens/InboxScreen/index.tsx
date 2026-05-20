import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAcceptDmRequest } from '@/application/hooks/useAcceptDmRequest/useAcceptDmRequest';
import { useDeclineDmRequest } from '@/application/hooks/useDeclineDmRequest/useDeclineDmRequest';
import { useDmConversations } from '@/application/hooks/useDmConversations/useDmConversations';
import { useDmInboxRealtime } from '@/application/hooks/useDmInboxRealtime/useDmInboxRealtime';
import { useDmRequests } from '@/application/hooks/useDmRequests/useDmRequests';
import type { DmConversationDto, DmRequestDto } from '@/infra/api/dm.api';
import { StackRoutes } from '@/presentation/navigation/routes';
import InboxLayout from './layout';
import type { InboxChipSpec } from './layout/types';
import { filterInbox } from './filter';
import type {
  DmConversation,
  DmRequest,
  InboxFilterId,
  InboxScreenProps,
} from './types';

function contentPreview(content: string | null): string {
  return content ?? '[mídia]';
}

function mapConversation(row: DmConversationDto): DmConversation {
  return {
    id: row.peerId,
    peer: {
      id: row.peerId,
      displayName: row.peerName,
      avatarUrl: row.peerAvatarUrl,
    },
    lastMessage: {
      content: contentPreview(row.lastMessage.content),
      createdAt: row.lastMessage.createdAt,
      fromMe: row.lastMessage.senderName !== row.peerName,
    },
    unreadCount: row.unreadCount,
    isArchived: row.archived,
  };
}

function mapRequest(row: DmRequestDto): DmRequest {
  return {
    id: row.id,
    peer: {
      id: row.senderId,
      displayName: row.senderName,
      avatarUrl: row.senderAvatarUrl,
    },
    message: contentPreview(row.content),
    createdAt: row.createdAt,
  };
}

export default function InboxScreen({ navigation }: InboxScreenProps) {
  const [activeFilter, setActiveFilter] = useState<InboxFilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();
  const conversationsQuery = useDmConversations({ enabled: isFocused });
  const requestsQuery = useDmRequests({ enabled: isFocused });
  useDmInboxRealtime({ enabled: isFocused });
  const acceptDmRequest = useAcceptDmRequest();
  const declineDmRequest = useDeclineDmRequest();

  const allDms = useMemo(
    () => conversationsQuery.conversations.map(mapConversation),
    [conversationsQuery.conversations],
  );
  const allRequests = useMemo(
    () => requestsQuery.requests.map(mapRequest),
    [requestsQuery.requests],
  );

  const totals = useMemo(() => {
    const active = allDms.filter((d) => !d.isArchived);
    const unread = active.filter((d) => d.unreadCount > 0).length;
    const archived = allDms.length - active.length;
    return {
      active: active.length,
      unread,
      archived,
      requests: allRequests.length,
    };
  }, [allDms, allRequests.length]);

  const chips = useMemo<InboxChipSpec[]>(
    () => [
      { id: 'all', label: 'Todas', count: totals.active },
      { id: 'unread', label: 'Não lidas', count: totals.unread, dot: true },
      {
        id: 'requests',
        label: 'Solicitações',
        count: totals.requests,
        icon: 'bell',
      },
      {
        id: 'archived',
        label: 'Arquivadas',
        count: totals.archived,
        icon: 'shield',
      },
    ],
    [totals],
  );

  const { conversations, requests, emptyLabel } = useMemo(
    () => filterInbox(allDms, allRequests, activeFilter, searchQuery),
    [activeFilter, allDms, allRequests, searchQuery],
  );

  const showingRequests = activeFilter === 'requests';
  const isLoading = showingRequests
    ? requestsQuery.isLoading
    : conversationsQuery.isLoading;
  const isLoadingMore = showingRequests
    ? requestsQuery.isFetchingNextPage
    : conversationsQuery.isFetchingNextPage;
  const isError = showingRequests
    ? requestsQuery.isError
    : conversationsQuery.isError;
  const hasRows = showingRequests
    ? requests.length > 0
    : conversations.length > 0;

  const errorMessage = isError && !hasRows
    ? showingRequests
      ? 'Não foi possível carregar as solicitações.'
      : 'Não foi possível carregar as conversas.'
    : null;

  const handleOpenDm = (dm: DmConversation) => {
    navigation.navigate(StackRoutes.DmChat, {
      peerId: dm.peer.id,
      peerName: dm.peer.displayName,
      peerAvatarUrl: dm.peer.avatarUrl,
      initialArchived: dm.isArchived,
    });
  };

  const handleAcceptRequest = (id: string) => {
    const request = allRequests.find((r) => r.id === id);
    acceptDmRequest.mutate(id, {
      onSuccess: (message) => {
        navigation.navigate(StackRoutes.DmChat, {
          peerId: request?.peer.id ?? message.senderId,
          peerName: request?.peer.displayName ?? message.senderName,
          peerAvatarUrl: request?.peer.avatarUrl ?? message.senderAvatarUrl,
          initialArchived: false,
        });
      },
      onError: () => {
        Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
      },
    });
  };

  const handleIgnoreRequest = (id: string) => {
    declineDmRequest.mutate(id, {
      onError: () => {
        Alert.alert('Erro', 'Não foi possível ignorar a solicitação.');
      },
    });
  };

  const noop = () => {};

  return (
    <InboxLayout
      totalActive={totals.active}
      unreadTotal={totals.unread}
      activeFilter={activeFilter}
      searchQuery={searchQuery}
      chips={chips}
      conversations={conversations}
      requests={requests}
      emptyLabel={!isLoading && !errorMessage ? emptyLabel : null}
      loading={isLoading && !hasRows}
      loadingMore={isLoadingMore}
      errorMessage={errorMessage}
      onChangeSearch={setSearchQuery}
      onChangeFilter={setActiveFilter}
      onOpenDm={handleOpenDm}
      onAcceptRequest={handleAcceptRequest}
      onIgnoreRequest={handleIgnoreRequest}
      onPressEdit={noop}
      onLoadMore={showingRequests ? requestsQuery.loadMore : conversationsQuery.loadMore}
      requestActionsDisabled={
        acceptDmRequest.isPending || declineDmRequest.isPending
      }
    />
  );
}
