import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  groupsApi,
  type GroupDetail,
  type GroupMember,
} from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';

export type BanMemberVars = { groupId: string; userId: string };

interface Context {
  previousDetail: GroupDetail | undefined;
}

export function useBanMember(): UseMutationResult<
  void,
  Error,
  BanMemberVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, BanMemberVars, Context>({
    mutationKey: ['ban-member'],
    mutationFn: ({ groupId, userId }) => groupsApi.banMember(groupId, userId),
    onMutate: async ({ groupId, userId }) => {
      const detailKey = groupDetailKey(groupId);
      const membersPrefix = ['groups', 'members', groupId];

      await queryClient.cancelQueries({ queryKey: membersPrefix });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousDetail = queryClient.getQueryData<GroupDetail>(detailKey);

      queryClient.setQueriesData<GroupMember[]>(
        { queryKey: membersPrefix },
        (prev) => prev?.filter((m) => m.userId !== userId),
      );
      queryClient.setQueryData<GroupDetail>(detailKey, (prev) =>
        prev
          ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) }
          : prev,
      );

      return { previousDetail };
    },
    onError: (_err, { groupId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(groupDetailKey(groupId), context.previousDetail);
      }
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'members', groupId],
      });
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'members', groupId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'banned', groupId],
      });
      void queryClient.invalidateQueries({ queryKey: groupDetailKey(groupId) });
    },
  });
}
