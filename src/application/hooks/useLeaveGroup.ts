import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { groupsApi } from '@/infra/api/groups.api';
import {
  MY_GROUPS_KEY,
  restoreMyGroupsCaches,
  snapshotMyGroupsCaches,
  updateMyGroupsCaches,
  type MyGroupsSnapshot,
} from './useMyGroups';
import { groupDetailKey } from './useGroupDetail';

export type LeaveGroupVars = { groupId: string };

interface Context {
  previousMyGroups: MyGroupsSnapshot;
}

export function useLeaveGroup(): UseMutationResult<
  void,
  Error,
  LeaveGroupVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, LeaveGroupVars, Context>({
    mutationKey: ['leave-group'],
    mutationFn: ({ groupId }) => groupsApi.leaveGroup(groupId),
    onMutate: async ({ groupId }) => {
      await queryClient.cancelQueries({ queryKey: MY_GROUPS_KEY });
      const previousMyGroups = snapshotMyGroupsCaches(queryClient);
      updateMyGroupsCaches(queryClient, (prev) =>
        prev.filter((g) => g.id !== groupId),
      );
      return { previousMyGroups };
    },
    onError: (_err, _vars, context) => {
      restoreMyGroupsCaches(queryClient, context?.previousMyGroups);
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.removeQueries({ queryKey: groupDetailKey(groupId) });
      queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
    },
  });
}
