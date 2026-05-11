import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { groupsApi } from '@/infra/api/groups.api';
import { useGroupJoinRequests } from './useGroupJoinRequests';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { listJoinRequests: jest.fn() },
}));

const mockedList = groupsApi.listJoinRequests as jest.MockedFunction<
  typeof groupsApi.listJoinRequests
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

describe('useGroupJoinRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches requests when enabled', async () => {
    mockedList.mockResolvedValueOnce([
      {
        id: 'r-1',
        userId: 'u-1',
        displayName: 'Alice',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useGroupJoinRequests('g-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedList).toHaveBeenCalledWith('g-1');
    expect(result.current.data).toHaveLength(1);
    client.clear();
  });

  it('does not fetch when disabled', async () => {
    const { client, wrapper } = makeWrapper();

    renderHook(() => useGroupJoinRequests('g-1', { enabled: false }), {
      wrapper,
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockedList).not.toHaveBeenCalled();
    client.clear();
  });
});
