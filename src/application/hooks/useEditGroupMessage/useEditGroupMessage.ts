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
 * Idempotent: rewrites the message's content + editedAt if either differs,
 * otherwise returns the same reference. Shared with the `MESSAGE_EDITED` WS
 * handler in `useGroupChat` so the optimistic apply and the server echo
 * converge on the same cache mutation — the second pass is a no-op.
 */
export function applyEditedToGroupMessage(
  old: GroupHistoryCache | undefined,
  patch: { messageId: string; content: string; editedAt: string },
): GroupHistoryCache | undefined {
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

export type EditGroupMessageVars = {
  groupId: string;
  messageId: string;
  content: string;
};

interface Context {
  previous: GroupHistoryCache | undefined;
  groupId: string;
}

export function useEditGroupMessage(): UseMutationResult<
  void,
  Error,
  EditGroupMessageVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EditGroupMessageVars, Context>({
    mutationKey: ['edit-group-message'],
    mutationFn: ({ messageId, content }) =>
      messagesApi.editMessage(messageId, { content }),
    onMutate: async ({ groupId, messageId, content }) => {
      await queryClient.cancelQueries({ queryKey: chatHistoryKey(groupId) });
      const previous = queryClient.getQueryData<GroupHistoryCache>(
        chatHistoryKey(groupId),
      );
      queryClient.setQueryData<GroupHistoryCache>(
        chatHistoryKey(groupId),
        (old) =>
          applyEditedToGroupMessage(old, {
            messageId,
            content,
            editedAt: new Date().toISOString(),
          }),
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
