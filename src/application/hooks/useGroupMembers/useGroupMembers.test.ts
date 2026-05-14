import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemberRole } from '@localloop/shared-types';
import { groupsApi, type GroupMember } from '@/infra/api/groups.api';
import { useGroupMembers } from './useGroupMembers';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { listMembers: jest.fn() },
}));

const mockedList = groupsApi.listMembers as jest.MockedFunction<
  typeof groupsApi.listMembers
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

function makeMember(i: number): GroupMember {
  return {
    userId: `u-${i}`,
    displayName: `User ${i}`,
    avatarUrl: null,
    role: MemberRole.MEMBER,
  };
}

describe('useGroupMembers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('slices the API response to the requested limit', async () => {
    mockedList.mockResolvedValueOnce({
      data: [makeMember(1), makeMember(2), makeMember(3), makeMember(4)],
      next_cursor: null,
    });
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useGroupMembers('g-1', { limit: 2 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(mockedList).toHaveBeenCalledWith('g-1');
    client.clear();
  });

  it('does not fetch when disabled', async () => {
    const { client, wrapper } = makeWrapper();

    renderHook(() => useGroupMembers('g-1', { enabled: false }), { wrapper });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockedList).not.toHaveBeenCalled();
    client.clear();
  });
});
