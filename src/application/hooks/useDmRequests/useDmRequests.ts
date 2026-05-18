import { useCallback, useMemo } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmRequestDto,
  type ListDmRequestsResponse,
} from '@/infra/api/dm.api';

export const DM_REQUESTS_KEY = ['dm', 'requests'] as const;

export const dmRequestsKey = (limit: number) =>
  [...DM_REQUESTS_KEY, limit] as const;

export interface UseDmRequestsResult {
  requests: DmRequestDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  query: UseInfiniteQueryResult<InfiniteData<ListDmRequestsResponse>, Error>;
}

export interface UseDmRequestsOptions {
  limit?: number;
  enabled?: boolean;
}

function normalizeOptions(
  input: number | UseDmRequestsOptions = {},
): Required<UseDmRequestsOptions> {
  if (typeof input === 'number') return { limit: input, enabled: true };
  return {
    limit: input.limit ?? 20,
    enabled: input.enabled ?? true,
  };
}

export function useDmRequests(
  options: number | UseDmRequestsOptions = {},
): UseDmRequestsResult {
  const { limit, enabled } = normalizeOptions(options);
  const query = useInfiniteQuery<
    ListDmRequestsResponse,
    Error,
    InfiniteData<ListDmRequestsResponse>,
    ReturnType<typeof dmRequestsKey>,
    string | undefined
  >({
    queryKey: dmRequestsKey(limit),
    queryFn: ({ pageParam }) =>
      dmApi.listDmRequests({ limit, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  const requests = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  return {
    requests,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    query,
  };
}
