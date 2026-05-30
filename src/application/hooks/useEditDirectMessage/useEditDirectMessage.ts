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
 * Idempotent: rewrites the message's content + editedAt if either differs,
 * otherwise returns the same reference. Shared with the
 * `DIRECT_MESSAGE_EDITED` WS handler in `useDmChat` so the optimistic apply
 * and the server echo converge on the same cache mutation — the second pass
 * is a no-op.
 */
export function applyEditedToDirectMessage(
  old: DmHistoryInfiniteData | undefined,
  patch: { messageId: string; content: string; editedAt: string },
): DmHistoryInfiniteData | undefined {
  if (!old) return old;
  let changed = false;
  const pages = old.pages.map((page) => {
    let pageChanged = false;
    const next = page.data.map((m) => {
      if (m.id !== patch.messageId) return m;
      if (m.content === patch.content && m.editedAt === patch.editedAt) return m;
      pageChanged = true;
      return { ...m, content: patch.content, editedAt: patch.editedAt };
    });
    if (!pageChanged) return page;
    changed = true;
    return { ...page, data: next };
  });
  return changed ? { ...old, pages } : old;
}

export type EditDirectMessageVars = {
  peerId: string;
  messageId: string;
  content: string;
};

interface Context {
  previous: DmHistoryInfiniteData | undefined;
  peerId: string;
}

export function useEditDirectMessage(): UseMutationResult<
  void,
  Error,
  EditDirectMessageVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EditDirectMessageVars, Context>({
    mutationKey: ['edit-direct-message'],
    mutationFn: ({ messageId, content }) =>
      dmApi.editDirectMessage(messageId, { content }),
    onMutate: async ({ peerId, messageId, content }) => {
      await queryClient.cancelQueries({ queryKey: dmHistoryKey(peerId) });
      const previous = queryClient.getQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
      );
      queryClient.setQueryData<DmHistoryInfiniteData>(
        dmHistoryKey(peerId),
        (old) =>
          applyEditedToDirectMessage(old, {
            messageId,
            content,
            editedAt: new Date().toISOString(),
          }),
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
