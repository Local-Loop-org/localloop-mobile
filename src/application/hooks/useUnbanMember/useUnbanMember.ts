import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { groupsApi, type GroupMember } from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';
import { bannedMembersKey } from '../useBannedMembers/useBannedMembers';

export type UnbanMemberVars = { groupId: string; userId: string };

interface Context {
  previousBanned: GroupMember[] | undefined;
}

export function useUnbanMember(): UseMutationResult<
  void,
  Error,
  UnbanMemberVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UnbanMemberVars, Context>({
    mutationKey: ['unban-member'],
    mutationFn: ({ groupId, userId }) =>
      groupsApi.unbanMember(groupId, userId),
    onMutate: async ({ groupId, userId }) => {
      const key = bannedMembersKey(groupId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousBanned = queryClient.getQueryData<GroupMember[]>(key);
      queryClient.setQueryData<GroupMember[]>(key, (prev) =>
        prev?.filter((m) => m.userId !== userId),
      );

      return { previousBanned };
    },
    onError: (_err, { groupId }, context) => {
      if (context?.previousBanned !== undefined) {
        queryClient.setQueryData(bannedMembersKey(groupId), context.previousBanned);
      }
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'members', groupId],
      });
      void queryClient.invalidateQueries({
        queryKey: bannedMembersKey(groupId),
      });
      void queryClient.invalidateQueries({ queryKey: groupDetailKey(groupId) });
    },
  });
}
