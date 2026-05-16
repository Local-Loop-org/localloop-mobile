import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type GroupMember } from '@/infra/api/groups.api';

export const bannedMembersKey = (groupId: string) =>
  ['groups', 'banned', groupId] as const;

interface Options {
  enabled?: boolean;
}

/**
 * Owner/moderator-only listing of banned members. The first-page-only shape
 * (matches `useGroupMembers`) is enough for v1 — the typical banned list is
 * short; full `useInfiniteQuery` pagination can come with the wider TD-09
 * migration when needed.
 */
export function useBannedMembers(
  groupId: string,
  { enabled = true }: Options = {},
): UseQueryResult<GroupMember[], Error> {
  return useQuery<GroupMember[], Error>({
    queryKey: bannedMembersKey(groupId),
    queryFn: async () => {
      const response = await groupsApi.listBannedMembers(groupId);
      return response.data;
    },
    enabled,
    staleTime: 30_000,
  });
}
