import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { GroupMessageHistoryResponse } from '@localloop/shared-types';
import { messagesApi } from '@/infra/api/messages.api';
import { chatHistoryKey } from '../useGroupChat/useGroupChat';

export type GroupHistoryCache = InfiniteData<GroupMessageHistoryResponse>;

/**
 * Idempotent: flips the matching message's `isDeleted` to true and blanks its
 * `content` so the bubble can render as a tombstone in place; returns the
 * same reference when the message is missing or already marked. Shared with
 * the `MESSAGE_DELETED` WS handler in `useGroupChat` so both code paths
 * converge on the same cache update.
 */
export function markGroupMessageDeleted(
  old: GroupHistoryCache | undefined,
  messageId: string,
): GroupHistoryCache | undefined {
  if (!old) return old;
  let changed = false;
  const pages = old.pages.map((page) => {
    let pageChanged = false;
    const next = page.data.map((m) => {
      if (m.id !== messageId || m.isDeleted) return m;
      pageChanged = true;
      return { ...m, isDeleted: true, content: '' };
    });
    if (!pageChanged) return page;
    changed = true;
    return { ...page, data: next };
  });
  return changed ? { ...old, pages } : old;
}

/**
 * Filters the matching message out of every cached page. Used by E6 to drop a
 * failed optimistic temp from the cache when the user discards it — a true
 * removal rather than a tombstone, because a never-sent message has nothing
 * to memorialise. Idempotent: returns the same reference when nothing matches.
 */
export function removeGroupMessageById(
  old: GroupHistoryCache | undefined,
  messageId: string,
): GroupHistoryCache | undefined {
  if (!old) return old;
  let changed = false;
  const pages = old.pages.map((page) => {
    const next = page.data.filter((m) => m.id !== messageId);
    if (next.length === page.data.length) return page;
    changed = true;
    return { ...page, data: next };
  });
  return changed ? { ...old, pages } : old;
}

export type DeleteGroupMessageVars = {
  groupId: string;
  messageId: string;
};

interface Context {
  previous: GroupHistoryCache | undefined;
  groupId: string;
}

export function useDeleteGroupMessage(): UseMutationResult<
  void,
  Error,
  DeleteGroupMessageVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteGroupMessageVars, Context>({
    mutationKey: ['delete-group-message'],
    mutationFn: ({ messageId }) => messagesApi.deleteMessage(messageId),
    onMutate: async ({ groupId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: chatHistoryKey(groupId) });
      const previous = queryClient.getQueryData<GroupHistoryCache>(
        chatHistoryKey(groupId),
      );
      queryClient.setQueryData<GroupHistoryCache>(chatHistoryKey(groupId), (old) =>
        markGroupMessageDeleted(old, messageId),
      );
      return { previous, groupId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      queryClient.setQueryData<GroupHistoryCache>(
        chatHistoryKey(ctx.groupId),
        ctx.previous,
      );
    },
  });
}
