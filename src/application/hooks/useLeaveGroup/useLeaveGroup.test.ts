import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';
import { myGroupsKey } from '../useMyGroups/useMyGroups';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';
import { useLeaveGroup } from './useLeaveGroup';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { leaveGroup: jest.fn() },
}));

const mockedLeave = groupsApi.leaveGroup as jest.MockedFunction<
  typeof groupsApi.leaveGroup
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
    myRole: MemberRole.MEMBER,
    lastActivityAt: '2026-01-01T00:00:00Z',
    lastReadAt: '2026-01-01T00:00:00Z',
    lastMessage: null,
    unreadCount: 0,
  }));
  client.setQueryData(myGroupsKey(5), groups);
}

describe('useLeaveGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically removes the group from MY_GROUPS_KEY', async () => {
    mockedLeave.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedMyGroups(client, ['g-1', 'g-2']);

    const { result } = renderHook(() => useLeaveGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const cached = client.getQueryData<MyGroup[]>(myGroupsKey(5));
    expect(cached?.map((g) => g.id)).toEqual(['g-2']);
    client.clear();
  });

  it('rolls back MY_GROUPS_KEY on API failure', async () => {
    mockedLeave.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedMyGroups(client, ['g-1', 'g-2']);

    const { result } = renderHook(() => useLeaveGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = client.getQueryData<MyGroup[]>(myGroupsKey(5));
    expect(cached?.map((g) => g.id)).toEqual(['g-1', 'g-2']);
    client.clear();
  });

  it('removes the group detail cache on success', async () => {
    mockedLeave.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    client.setQueryData(groupDetailKey('g-1'), { id: 'g-1' });

    const { result } = renderHook(() => useLeaveGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(groupDetailKey('g-1'))).toBeUndefined();
    client.clear();
  });
});
