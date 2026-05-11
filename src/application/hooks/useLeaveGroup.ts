import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';
import { MY_GROUPS_KEY } from './useMyGroups';
import { groupDetailKey } from './useGroupDetail';

export type LeaveGroupVars = { groupId: string };

interface Context {
  previousMyGroups: MyGroup[] | undefined;
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
      const previousMyGroups =
        queryClient.getQueryData<MyGroup[]>(MY_GROUPS_KEY);
      queryClient.setQueryData<MyGroup[]>(MY_GROUPS_KEY, (prev) =>
        prev ? prev.filter((g) => g.id !== groupId) : prev,
      );
      return { previousMyGroups };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMyGroups) {
        queryClient.setQueryData(MY_GROUPS_KEY, context.previousMyGroups);
      }
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.removeQueries({ queryKey: groupDetailKey(groupId) });
      queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
    },
  });
}
