import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { MemberRole } from '@localloop/shared-types';
import {
  groupsApi,
  type GroupMember,
} from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';

export type DemoteMemberVars = { groupId: string; userId: string };

interface Context {
  previousMembers: Array<[readonly unknown[], GroupMember[] | undefined]>;
}

/**
 * Demote a MODERATOR back to MEMBER. Optimistically flips the role across
 * every cached `['groups','members', groupId, …]` list. Owner-only on the
 * server; the UI hides the action button for non-owners.
 */
export function useDemoteMember(): UseMutationResult<
  void,
  Error,
  DemoteMemberVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DemoteMemberVars, Context>({
    mutationKey: ['demote-member'],
    mutationFn: ({ groupId, userId }) =>
      groupsApi.demoteMember(groupId, userId),
    onMutate: async ({ groupId, userId }) => {
      const membersPrefix = ['groups', 'members', groupId];
      await queryClient.cancelQueries({ queryKey: membersPrefix });

      const previousMembers = queryClient.getQueriesData<GroupMember[]>({
        queryKey: membersPrefix,
      });

      queryClient.setQueriesData<GroupMember[]>(
        { queryKey: membersPrefix },
        (prev) =>
          prev?.map((m) =>
            m.userId === userId ? { ...m, role: MemberRole.MEMBER } : m,
          ),
      );

      return { previousMembers };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.previousMembers) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'members', groupId],
      });
      void queryClient.invalidateQueries({ queryKey: groupDetailKey(groupId) });
    },
  });
}
