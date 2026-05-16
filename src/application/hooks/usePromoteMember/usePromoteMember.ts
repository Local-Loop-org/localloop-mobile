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

export type PromoteMemberVars = { groupId: string; userId: string };

interface Context {
  previousMembers: Array<[readonly unknown[], GroupMember[] | undefined]>;
}

/**
 * Promote a regular MEMBER to MODERATOR. Optimistically flips the role across
 * every cached `['groups','members', groupId, …]` list (preview + full screen).
 * Rolls back on error and invalidates on success so any other consumers stay
 * fresh.
 */
export function usePromoteMember(): UseMutationResult<
  void,
  Error,
  PromoteMemberVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PromoteMemberVars, Context>({
    mutationKey: ['promote-member'],
    mutationFn: ({ groupId, userId }) =>
      groupsApi.promoteMember(groupId, userId),
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
            m.userId === userId ? { ...m, role: MemberRole.MODERATOR } : m,
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
