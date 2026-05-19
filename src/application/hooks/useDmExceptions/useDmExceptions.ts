import { useCallback, useMemo } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmExceptionDto,
  type ListDmExceptionsResponse,
} from '@/infra/api/dm.api';

export const DM_EXCEPTIONS_KEY = ['dm', 'exceptions'] as const;

export const dmExceptionsKey = (limit: number) =>
  [...DM_EXCEPTIONS_KEY, limit] as const;

export interface UseDmExceptionsResult {
  exceptions: DmExceptionDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  query: UseInfiniteQueryResult<InfiniteData<ListDmExceptionsResponse>, Error>;
}

export interface UseDmExceptionsOptions {
  limit?: number;
  enabled?: boolean;
}

function normalizeOptions(
  input: number | UseDmExceptionsOptions = {},
): Required<UseDmExceptionsOptions> {
  if (typeof input === 'number') return { limit: input, enabled: true };
  return {
    limit: input.limit ?? 20,
    enabled: input.enabled ?? true,
  };
}

export function useDmExceptions(
  options: number | UseDmExceptionsOptions = {},
): UseDmExceptionsResult {
  const { limit, enabled } = normalizeOptions(options);
  const query = useInfiniteQuery<
    ListDmExceptionsResponse,
    Error,
    InfiniteData<ListDmExceptionsResponse>,
    ReturnType<typeof dmExceptionsKey>,
    string | undefined
  >({
    queryKey: dmExceptionsKey(limit),
    queryFn: ({ pageParam }) =>
      dmApi.listDmExceptions({ limit, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  const exceptions = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  return {
    exceptions,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    query,
  };
}
