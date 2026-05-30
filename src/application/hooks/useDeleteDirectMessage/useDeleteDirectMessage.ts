import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { dmApi } from '@/infra/api/dm.api';
import {
  dmHistoryKey,
  type DmHistoryInfiniteData,
} from '../useDmHistory/dmHistoryQuery';

/**
 * Idempotent: flips the matching message's `isDeleted` to true and blanks its
 * `content` so the bubble can render as a tombstone in place; returns the
 * same reference when the message is missing or already marked. Shared with
 * the `DIRECT_MESSAGE_DELETED` WS handler in `useDmChat`.
 */
export function markDirectMessageDeleted(
  old: DmHistoryInfiniteData | undefined,
  messageId: string,
): DmHistoryInfiniteData | undefined {
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

export type DeleteDirectMessageVars = {
  peerId: string;
  messageId: string;
};

interface Context {
  previous: DmHistoryInfiniteData | undefined;
  peerId: string;
}

export function useDeleteDirectMessage(): UseMutationResult<
  void,
  Error,
  DeleteDirectMessageVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteDirectMessageVars, Context>({
    mutationKey: ['delete-direct-message'],
    mutationFn: ({ messageId }) => dmApi.deleteDirectMessage(messageId),
    onMutate: async ({ peerId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: dmHistoryKey(peerId) });
      const previous = queryClient.getQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
      );
      queryClient.setQueryData<DmHistoryInfiniteData>(dmHistoryKey(peerId), (old) =>
        markDirectMessageDeleted(old, messageId),
      );
      return { previous, peerId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(ctx.peerId),
        ctx.previous,
      );
    },
  });
}
