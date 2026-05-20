import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { dmApi } from '@/infra/api/dm.api';
import {
  DM_CONVERSATIONS_KEY,
  restoreDmConversationCaches,
  setDmArchivedInCaches,
  snapshotDmConversationCaches,
  type DmConversationsSnapshot,
} from '../useDmConversations/useDmConversations';

interface Context {
  previousConversations: DmConversationsSnapshot;
}

export function useUnarchiveDmConversation(): UseMutationResult<
  void,
  Error,
  string,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, Context>({
    mutationKey: ['dm', 'conversations', 'unarchive'],
    mutationFn: (peerId) => dmApi.unarchiveDmConversation(peerId),
    onMutate: async (peerId) => {
      await queryClient.cancelQueries({ queryKey: DM_CONVERSATIONS_KEY });
      const previousConversations = snapshotDmConversationCaches(queryClient);
      setDmArchivedInCaches(queryClient, peerId, false);
      return { previousConversations };
    },
    onError: (_err, _peerId, context) => {
      restoreDmConversationCaches(queryClient, context?.previousConversations);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DM_CONVERSATIONS_KEY });
    },
  });
}
