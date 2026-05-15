import {
  useQuery,
  type QueryClient,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  groupsApi,
  type GroupSummaryUpdate,
  type MyGroup,
} from '@/infra/api/groups.api';

export const MY_GROUPS_KEY = ['groups', 'me'] as const;

export const myGroupsKey = (limit: number) =>
  [...MY_GROUPS_KEY, limit] as const;

export type MyGroupsSnapshot = Array<[QueryKey, MyGroup[] | undefined]>;

function sortByActivity(groups: MyGroup[]): MyGroup[] {
  return [...groups].sort((a, b) => {
    const diff =
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime();
    return diff === 0 ? b.id.localeCompare(a.id) : diff;
  });
}

export function snapshotMyGroupsCaches(
  queryClient: QueryClient,
): MyGroupsSnapshot {
  return queryClient.getQueriesData<MyGroup[]>({ queryKey: MY_GROUPS_KEY });
}

export function restoreMyGroupsCaches(
  queryClient: QueryClient,
  snapshot: MyGroupsSnapshot | undefined,
): void {
  for (const [queryKey, data] of snapshot ?? []) {
    queryClient.setQueryData(queryKey, data);
  }
}

export function updateMyGroupsCaches(
  queryClient: QueryClient,
  updater: (groups: MyGroup[]) => MyGroup[],
): void {
  queryClient.setQueriesData<MyGroup[]>({ queryKey: MY_GROUPS_KEY }, (prev) =>
    prev ? updater(prev) : prev,
  );
}

export function applyGroupSummaryUpdate(
  queryClient: QueryClient,
  update: GroupSummaryUpdate,
): void {
  updateMyGroupsCaches(queryClient, (groups) => {
    let touched = false;
    const next = groups.map((group) => {
      if (group.id !== update.groupId) return group;
      touched = true;
      return {
        ...group,
        lastActivityAt: update.lastActivityAt,
        lastMessage: update.lastMessage,
        lastReadAt: update.lastReadAt,
        unreadCount: update.unreadCount,
      };
    });
    return touched ? sortByActivity(next) : groups;
  });
}

export function markMyGroupReadInCaches(
  queryClient: QueryClient,
  groupId: string,
): void {
  updateMyGroupsCaches(queryClient, (groups) =>
    groups.map((group) =>
      group.id === groupId ? { ...group, unreadCount: 0 } : group,
    ),
  );
}

export function useMyGroups(limit = 5): UseQueryResult<MyGroup[], Error> {
  return useQuery<MyGroup[], Error>({
    queryKey: myGroupsKey(limit),
    queryFn: async () => {
      const response = await groupsApi.getMyGroups(limit);
      return response.data;
    },
    staleTime: 30_000,
  });
}
