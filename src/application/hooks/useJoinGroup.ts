import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  groupsApi,
  type GroupDetail,
  type JoinGroupResult,
  type MyGroup,
} from '@/infra/api/groups.api';
import { MY_GROUPS_KEY } from './useMyGroups';

export type JoinGroupVars = {
  groupId: string;
  group: Pick<GroupDetail, 'id' | 'name' | 'anchorType' | 'anchorLabel' | 'memberCount'>;
};

export function useJoinGroup(): UseMutationResult<JoinGroupResult, Error, JoinGroupVars> {
  const queryClient = useQueryClient();

  return useMutation<JoinGroupResult, Error, JoinGroupVars>({
    mutationKey: ['join-group'],
    mutationFn: ({ groupId }) => groupsApi.joinGroup(groupId),
    onSuccess(result, { group }) {
      if (result.status !== 'joined') return;
      const optimistic: MyGroup = {
        id: group.id,
        name: group.name,
        anchorType: group.anchorType,
        anchorLabel: group.anchorLabel,
        memberCount: group.memberCount + 1,
        myRole: result.role,
        lastActivityAt: new Date().toISOString(),
        lastMessage: null,
      };
      queryClient.setQueryData<MyGroup[]>(MY_GROUPS_KEY, (prev) =>
        prev ? [optimistic, ...prev] : [optimistic],
      );
      queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
    },
  });
}
