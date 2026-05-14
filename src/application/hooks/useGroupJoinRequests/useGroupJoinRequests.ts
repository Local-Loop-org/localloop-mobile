import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type JoinRequest } from '@/infra/api/groups.api';

export const groupJoinRequestsKey = (groupId: string) =>
  ['groups', 'requests', groupId] as const;

interface Options {
  enabled?: boolean;
}

export function useGroupJoinRequests(
  groupId: string,
  { enabled = true }: Options = {},
): UseQueryResult<JoinRequest[], Error> {
  return useQuery<JoinRequest[], Error>({
    queryKey: groupJoinRequestsKey(groupId),
    queryFn: () => groupsApi.listJoinRequests(groupId),
    enabled,
    staleTime: 10_000,
  });
}
