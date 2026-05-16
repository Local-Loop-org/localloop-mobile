import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { groupsApi } from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';

export type UnbanMemberVars = { groupId: string; userId: string };

export function useUnbanMember(): UseMutationResult<
  void,
  Error,
  UnbanMemberVars
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UnbanMemberVars>({
    mutationKey: ['unban-member'],
    mutationFn: ({ groupId, userId }) =>
      groupsApi.unbanMember(groupId, userId),
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['groups', 'members', groupId],
      });
      void queryClient.invalidateQueries({ queryKey: groupDetailKey(groupId) });
    },
  });
}
