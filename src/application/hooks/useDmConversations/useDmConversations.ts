import { useCallback, useMemo } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  type QueryClient,
  type QueryKey,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { DmSummaryUpdate } from '@localloop/shared-types';
import {
  dmApi,
  type DmConversationDto,
  type ListDmConversationsResponse,
} from '@/infra/api/dm.api';

export const DM_CONVERSATIONS_KEY = ['dm', 'conversations'] as const;

export const dmConversationsKey = (limit: number) =>
  [...DM_CONVERSATIONS_KEY, limit] as const;

export type DmConversationsSnapshot = Array<
  [QueryKey, InfiniteData<ListDmConversationsResponse> | undefined]
>;

function sortByActivity(
  conversations: DmConversationDto[],
): DmConversationDto[] {
  return [...conversations].sort((a, b) => {
    const diff =
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime();
    return diff === 0 ? b.peerId.localeCompare(a.peerId) : diff;
  });
}

function updateConversationPages(
  old: InfiniteData<ListDmConversationsResponse> | undefined,
  updater: (rows: DmConversationDto[]) => DmConversationDto[],
): InfiniteData<ListDmConversationsResponse> | undefined {
  if (!old) return old;

  const nextRows = updater(old.pages.flatMap((page) => page.data));
  let offset = 0;

  return {
    ...old,
    pages: old.pages.map((page) => {
      const nextPageRows = nextRows.slice(offset, offset + page.data.length);
      offset += page.data.length;
      return { ...page, data: nextPageRows };
    }),
  };
}

export function snapshotDmConversationCaches(
  queryClient: QueryClient,
): DmConversationsSnapshot {
  return queryClient.getQueriesData<InfiniteData<ListDmConversationsResponse>>({
    queryKey: DM_CONVERSATIONS_KEY,
  });
}

export function restoreDmConversationCaches(
  queryClient: QueryClient,
  snapshot: DmConversationsSnapshot | undefined,
): void {
  for (const [queryKey, data] of snapshot ?? []) {
    queryClient.setQueryData(queryKey, data);
  }
}

export function updateDmConversationCaches(
  queryClient: QueryClient,
  updater: (rows: DmConversationDto[]) => DmConversationDto[],
): void {
  queryClient.setQueriesData<InfiniteData<ListDmConversationsResponse>>(
    { queryKey: DM_CONVERSATIONS_KEY },
    (old) => updateConversationPages(old, updater),
  );
}

export function setDmArchivedInCaches(
  queryClient: QueryClient,
  peerId: string,
  archived: boolean,
): void {
  updateDmConversationCaches(queryClient, (rows) =>
    rows.map((row) => (row.peerId === peerId ? { ...row, archived } : row)),
  );
}

export function markDmReadInCaches(
  queryClient: QueryClient,
  peerId: string,
): void {
  updateDmConversationCaches(queryClient, (rows) =>
    rows.map((row) =>
      row.peerId === peerId ? { ...row, unreadCount: 0 } : row,
    ),
  );
}

export function applyDmSummaryUpdate(
  queryClient: QueryClient,
  update: DmSummaryUpdate,
): boolean {
  let touched = false;

  updateDmConversationCaches(queryClient, (rows) => {
    let found = false;
    const next = rows.map((row) => {
      if (row.peerId !== update.peerId) return row;
      found = true;
      return {
        ...row,
        lastMessage: update.lastMessage ?? row.lastMessage,
        lastReadAt: update.lastReadAt,
        unreadCount: update.unreadCount,
        archived: update.archived,
      };
    });

    if (!found) return rows;
    touched = true;
    return sortByActivity(next);
  });

  if (!touched) {
    void queryClient.invalidateQueries({ queryKey: DM_CONVERSATIONS_KEY });
  }

  return touched;
}

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
