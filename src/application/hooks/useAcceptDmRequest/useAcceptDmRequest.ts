import {
  InfiniteData,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmConversationDto,
  type ListDmConversationsResponse,
  type ListDmRequestsResponse,
} from '@/infra/api/dm.api';
import type { ChatMessage } from '@/infra/api/messages.api';
import { DM_CONVERSATIONS_KEY } from '../useDmConversations/useDmConversations';
import { DM_REQUESTS_KEY } from '../useDmRequests/useDmRequests';

interface Context {
  previousRequests: Array<
    [QueryKey, InfiniteData<ListDmRequestsResponse> | undefined]
  >;
}

function removeRequest(
  old: InfiniteData<ListDmRequestsResponse> | undefined,
  requestId: string,
): InfiniteData<ListDmRequestsResponse> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: page.data.filter((request) => request.id !== requestId),
    })),
  };
}

function conversationFromMessage(message: ChatMessage): DmConversationDto {
  return {
    peerId: message.senderId,
    peerName: message.senderName,
    peerAvatarUrl: message.senderAvatar,
    lastMessage: {
      content: message.content,
      senderName: message.senderName,
      createdAt: message.createdAt,
    },
    unreadCount: 0,
    archived: false,
  };
}

function upsertConversation(
  old: InfiniteData<ListDmConversationsResponse> | undefined,
  message: ChatMessage,
): InfiniteData<ListDmConversationsResponse> | undefined {
  if (!old) return old;
  const [first] = old.pages;
  if (!first) return old;

  const next = conversationFromMessage(message);
  const pagesWithoutPeer = old.pages.map((page) => ({
    ...page,
    data: page.data.filter(
      (conversation) => conversation.peerId !== next.peerId,
    ),
  }));
  const [cleanFirst, ...cleanRest] = pagesWithoutPeer;
  if (!cleanFirst) return old;

  return {
    ...old,
    pages: [{ ...cleanFirst, data: [next, ...cleanFirst.data] }, ...cleanRest],
  };
}

export function useAcceptDmRequest(): UseMutationResult<
  ChatMessage,
  Error,
  string,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<ChatMessage, Error, string, Context>({
    mutationKey: ['dm', 'requests', 'accept'],
    mutationFn: (requestId) => dmApi.acceptDmRequest(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: DM_REQUESTS_KEY });
      const previousRequests =
        queryClient.getQueriesData<InfiniteData<ListDmRequestsResponse>>({
          queryKey: DM_REQUESTS_KEY,
        });

      queryClient.setQueriesData<InfiniteData<ListDmRequestsResponse>>(
        { queryKey: DM_REQUESTS_KEY },
        (old) => removeRequest(old, requestId),
      );

      return { previousRequests };
    },
    onError: (_err, _requestId, context) => {
      context?.previousRequests.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (message) => {
      queryClient.setQueriesData<InfiniteData<ListDmConversationsResponse>>(
        { queryKey: DM_CONVERSATIONS_KEY },
        (old) => upsertConversation(old, message),
      );
      void queryClient.invalidateQueries({ queryKey: DM_CONVERSATIONS_KEY });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DM_REQUESTS_KEY });
    },
  });
}
