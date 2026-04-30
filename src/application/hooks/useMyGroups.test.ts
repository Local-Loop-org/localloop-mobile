import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import { groupsApi, type MyGroup } from '@/infra/api/groups.api';
import { MY_GROUPS_KEY, useMyGroups } from './useMyGroups';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getMyGroups: jest.fn() },
}));

const mockedGetMyGroups = groupsApi.getMyGroups as jest.MockedFunction<
  typeof groupsApi.getMyGroups
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const sampleGroup: MyGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  memberCount: 5,
  myRole: MemberRole.MEMBER,
  lastActivityAt: '2026-04-24T10:00:00.000Z',
  lastMessage: {
    content: 'Bora correr amanhã?',
    senderName: 'Alice',
    createdAt: '2026-04-24T10:00:00.000Z',
  },
};

describe('MY_GROUPS_KEY', () => {
  it('is a stable tuple', () => {
    expect(MY_GROUPS_KEY).toEqual(['groups', 'me']);
  });
});

describe('useMyGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and returns the data array from the API response', async () => {
    mockedGetMyGroups.mockResolvedValue({
      data: [sampleGroup],
      next_cursor: null,
    });

    const { result } = renderHook(() => useMyGroups(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetMyGroups).toHaveBeenCalledWith(5);
    expect(result.current.data).toEqual([sampleGroup]);
  });

  it('passes the limit argument to the API call', async () => {
    mockedGetMyGroups.mockResolvedValue({ data: [], next_cursor: null });

    const { result } = renderHook(() => useMyGroups(10), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetMyGroups).toHaveBeenCalledWith(10);
  });

  it('returns an empty array when the user has no groups', async () => {
    mockedGetMyGroups.mockResolvedValue({ data: [], next_cursor: null });

    const { result } = renderHook(() => useMyGroups(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('surfaces API errors as query error state', async () => {
    mockedGetMyGroups.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useMyGroups(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network error');
  });
});
