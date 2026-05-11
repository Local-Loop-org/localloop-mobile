import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type GroupMember } from '@/infra/api/groups.api';

export const groupMembersKey = (groupId: string, limit: number) =>
  ['groups', 'members', groupId, limit] as const;

interface Options {
  limit?: number;
  enabled?: boolean;
}

/**
 * Single-page member list used for short summaries (e.g. the hero stack of
 * 5 avatars on GroupDetailScreen). The full paginated `useInfiniteQuery`
 * migration for GroupMembersScreen stays in the TD-09 RQ backlog.
 */
export function useGroupMembers(
  groupId: string,
  { limit = 5, enabled = true }: Options = {},
): UseQueryResult<GroupMember[], Error> {
  return useQuery<GroupMember[], Error>({
    queryKey: groupMembersKey(groupId, limit),
    queryFn: async () => {
      const response = await groupsApi.listMembers(groupId);
      return response.data.slice(0, limit);
    },
    enabled,
    staleTime: 60_000,
  });
}
