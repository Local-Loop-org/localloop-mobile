import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmExceptionCandidate,
  type ListDmExceptionCandidatesResponse,
} from '@/infra/api/dm.api';

export const DM_EXCEPTION_CANDIDATES_KEY = ['dm', 'exception-candidates'] as const;

export const dmExceptionCandidatesKey = (q: string, limit: number) =>
  [...DM_EXCEPTION_CANDIDATES_KEY, q, limit] as const;

const DEFAULT_DEBOUNCE_MS = 250;

export interface UseDmExceptionCandidatesOptions {
  q?: string;
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseDmExceptionCandidatesResult {
  candidates: DmExceptionCandidate[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  query: UseInfiniteQueryResult<
    InfiniteData<ListDmExceptionCandidatesResponse>,
    Error
  >;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return undefined;
    }
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

export function useDmExceptionCandidates(
  options: UseDmExceptionCandidatesOptions = {},
): UseDmExceptionCandidatesResult {
  const {
    q: rawQ = '',
    limit = 20,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const debouncedQ = useDebouncedValue(rawQ.trim(), debounceMs);

  const query = useInfiniteQuery<
    ListDmExceptionCandidatesResponse,
    Error,
    InfiniteData<ListDmExceptionCandidatesResponse>,
    ReturnType<typeof dmExceptionCandidatesKey>,
    string | undefined
  >({
    queryKey: dmExceptionCandidatesKey(debouncedQ, limit),
    queryFn: ({ pageParam }) =>
      dmApi.listDmExceptionCandidates({
        limit,
        cursor: pageParam,
        q: debouncedQ.length > 0 ? debouncedQ : undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  const candidates = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  return {
    candidates,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    query,
  };
}
