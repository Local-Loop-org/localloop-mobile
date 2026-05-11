import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type GroupDetail } from '@/infra/api/groups.api';

export const groupDetailKey = (groupId: string) =>
  ['groups', 'detail', groupId] as const;

export function useGroupDetail(
  groupId: string,
): UseQueryResult<GroupDetail, Error> {
  return useQuery<GroupDetail, Error>({
    queryKey: groupDetailKey(groupId),
    queryFn: () => groupsApi.getGroupDetail(groupId),
    staleTime: 30_000,
  });
}
