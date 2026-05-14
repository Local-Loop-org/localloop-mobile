import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import { groupsApi } from '@/infra/api/groups.api';
import { MY_GROUPS_KEY, myGroupsKey } from '../useMyGroups/useMyGroups';
import { useJoinGroup } from './useJoinGroup';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { joinGroup: jest.fn() },
}));

const mockedJoin = groupsApi.joinGroup as jest.MockedFunction<
  typeof groupsApi.joinGroup
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

const baseGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  memberCount: 10,
  description: null,
  privacy: GroupPrivacy.OPEN,
  myRole: null,
};

describe('useJoinGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls joinGroup with the given groupId', async () => {
    mockedJoin.mockResolvedValueOnce({ status: 'joined', role: MemberRole.MEMBER });
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useJoinGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1', group: baseGroup });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedJoin).toHaveBeenCalledWith('g-1');
    client.clear();
  });

  it('optimistically inserts the group into the my-groups cache on joined', async () => {
    mockedJoin.mockResolvedValueOnce({ status: 'joined', role: MemberRole.MEMBER });
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useJoinGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1', group: baseGroup });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached =
      client.getQueryData<import('@/infra/api/groups.api').MyGroup[]>(
        myGroupsKey(5),
      );
    expect(cached).toHaveLength(1);
    expect(cached![0]).toMatchObject({
      id: 'g-1',
      name: 'Morumbi Runners',
      memberCount: 11,
      myRole: MemberRole.MEMBER,
      lastMessage: null,
      unreadCount: 0,
    });
    client.clear();
  });

  it('prepends to existing my-groups cache entries', async () => {
    mockedJoin.mockResolvedValueOnce({ status: 'joined', role: MemberRole.MEMBER });
    const { client, wrapper } = makeWrapper();

    const existing = [
      {
        id: 'g-0',
        name: 'Other',
        anchorType: AnchorType.ESTABLISHMENT,
        anchorLabel: 'Café',
        memberCount: 3,
        myRole: MemberRole.MEMBER,
        lastActivityAt: '2026-01-01T00:00:00.000Z',
        lastMessage: null,
        unreadCount: 0,
      },
    ];
    client.setQueryData(myGroupsKey(5), existing);

    const { result } = renderHook(() => useJoinGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1', group: baseGroup });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached =
      client.getQueryData<import('@/infra/api/groups.api').MyGroup[]>(
        myGroupsKey(5),
      );
    expect(cached).toHaveLength(2);
    expect(cached![0].id).toBe('g-1');
    expect(cached![1].id).toBe('g-0');
    client.clear();
  });

  it('does not update cache when status is pending', async () => {
    mockedJoin.mockResolvedValueOnce({ status: 'pending' });
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useJoinGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1', group: baseGroup });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = client.getQueryData(MY_GROUPS_KEY);
    expect(cached).toBeUndefined();
    client.clear();
  });

  it('surfaces an error when joinGroup throws', async () => {
    mockedJoin.mockRejectedValueOnce(new Error('network'));
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useJoinGroup(), { wrapper });
    result.current.mutate({ groupId: 'g-1', group: baseGroup });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network');
    client.clear();
  });
});
