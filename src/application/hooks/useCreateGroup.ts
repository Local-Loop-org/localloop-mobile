import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  groupsApi,
  type CreateGroupBody,
  type CreatedGroup,
} from '@/infra/api/groups.api';
import { MY_GROUPS_KEY } from './useMyGroups';

const NEARBY_GROUPS_PREFIX = ['groups', 'nearby'] as const;

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation<CreatedGroup, Error, CreateGroupBody>({
    mutationFn: (body) => groupsApi.createGroup(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: NEARBY_GROUPS_PREFIX });
    },
  });
}
