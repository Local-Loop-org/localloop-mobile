import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';
import { MY_GROUPS_KEY } from './useMyGroups';
import { groupDetailKey } from './useGroupDetail';
import { useDeleteGroup } from './useDeleteGroup';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { deleteGroup: jest.fn() },
}));

const mockedDelete = groupsApi.deleteGroup as jest.MockedFunction<
  typeof groupsApi.deleteGroup
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

function seedMyGroups(client: QueryClient, ids: string[]) {
  const groups: MyGroup[] = ids.map((id) => ({
    id,
    name: `Group ${id}`,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Anywhere',
    memberCount: 5,
    myRole: MemberRole.OWNER,
    lastActivityAt: '2026-01-01T00:00:00Z',
    lastMessage: null,
  }));
  client.setQueryData(MY_GROUPS_KEY, groups);
}

describe('useDeleteGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically removes the group + clears detail cache on success', async () => {
    mockedDelete.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedMyGroups(client, ['g-1', 'g-2']);
    client.setQueryData(groupDetailKey('g-1'), { id: 'g-1' });

    const { result } = renderHook(() => useDeleteGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      client.getQueryData<MyGroup[]>(MY_GROUPS_KEY)?.map((g) => g.id),
    ).toEqual(['g-2']);
    expect(client.getQueryData(groupDetailKey('g-1'))).toBeUndefined();
    client.clear();
  });

  it('rolls back the cache on API failure', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedMyGroups(client, ['g-1']);

    const { result } = renderHook(() => useDeleteGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<MyGroup[]>(MY_GROUPS_KEY)?.map((g) => g.id),
    ).toEqual(['g-1']);
    client.clear();
  });
});
