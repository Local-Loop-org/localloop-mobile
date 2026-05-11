import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type GroupDetail,
  type UpdateGroupBody,
  groupsApi,
} from '@/infra/api/groups.api';
import { groupDetailKey } from './useGroupDetail';
import { MY_GROUPS_KEY } from './useMyGroups';

interface UpdateGroupVars {
  groupId: string;
  body: UpdateGroupBody;
}

interface Context {
  previousGroup: GroupDetail | undefined;
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation<GroupDetail, Error, UpdateGroupVars, Context>({
    mutationKey: ['update-group'],
    mutationFn: ({ groupId, body }) => groupsApi.updateGroup(groupId, body),
    onMutate: async ({ groupId, body }) => {
      await queryClient.cancelQueries({ queryKey: groupDetailKey(groupId) });
      const previousGroup = queryClient.getQueryData<GroupDetail>(
        groupDetailKey(groupId),
      );
      queryClient.setQueryData<GroupDetail>(groupDetailKey(groupId), (prev) =>
        prev ? { ...prev, ...body } : prev,
      );
      return { previousGroup };
    },
    onError: (_err, { groupId }, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(groupDetailKey(groupId), context.previousGroup);
      }
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupDetailKey(groupId) });
      queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
    },
  });
}
