import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';

export const MY_GROUPS_KEY = ['groups', 'me'] as const;

export function useMyGroups(limit = 5): UseQueryResult<MyGroup[], Error> {
  return useQuery<MyGroup[], Error>({
    queryKey: MY_GROUPS_KEY,
    queryFn: async () => {
      const response = await groupsApi.getMyGroups(limit);
      return response.data;
    },
    staleTime: 30_000,
  });
}
