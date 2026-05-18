import { useCallback, useMemo } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmConversationDto,
  type ListDmConversationsResponse,
} from '@/infra/api/dm.api';

export const DM_CONVERSATIONS_KEY = ['dm', 'conversations'] as const;

export const dmConversationsKey = (limit: number) =>
  [...DM_CONVERSATIONS_KEY, limit] as const;

export interface UseDmConversationsResult {
  conversations: DmConversationDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  query: UseInfiniteQueryResult<
    InfiniteData<ListDmConversationsResponse>,
    Error
  >;
}

export interface UseDmConversationsOptions {
  limit?: number;
  enabled?: boolean;
}

function normalizeOptions(
  input: number | UseDmConversationsOptions = {},
): Required<UseDmConversationsOptions> {
  if (typeof input === 'number') return { limit: input, enabled: true };
  return {
    limit: input.limit ?? 20,
    enabled: input.enabled ?? true,
  };
}

export function useDmConversations(
  options: number | UseDmConversationsOptions = {},
): UseDmConversationsResult {
  const { limit, enabled } = normalizeOptions(options);
  const query = useInfiniteQuery<
    ListDmConversationsResponse,
    Error,
    InfiniteData<ListDmConversationsResponse>,
    ReturnType<typeof dmConversationsKey>,
    string | undefined
  >({
    queryKey: dmConversationsKey(limit),
    queryFn: ({ pageParam }) =>
      dmApi.listDmConversations({ limit, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  const conversations = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  return {
    conversations,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    query,
  };
}
