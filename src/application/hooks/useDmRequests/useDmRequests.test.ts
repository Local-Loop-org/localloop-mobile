import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dmApi, type DmRequestDto } from '@/infra/api/dm.api';
import { DM_REQUESTS_KEY, dmRequestsKey, useDmRequests } from './useDmRequests';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    listDmRequests: jest.fn(),
  },
}));

const mockedListDmRequests = dmApi.listDmRequests as jest.MockedFunction<
  typeof dmApi.listDmRequests
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const request = (overrides: Partial<DmRequestDto> = {}): DmRequestDto => ({
  id: 'req-1',
  senderId: 'u-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  content: 'oi',
  createdAt: '2026-05-18T10:00:00.000Z',
  ...overrides,
});

describe('DM_REQUESTS_KEY', () => {
  it('is a stable tuple', () => {
    expect(DM_REQUESTS_KEY).toEqual(['dm', 'requests']);
  });

  it('builds limit-specific query keys', () => {
    expect(dmRequestsKey(10)).toEqual(['dm', 'requests', 10]);
  });
});

describe('useDmRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and flattens the first page', async () => {
    mockedListDmRequests.mockResolvedValueOnce({
      data: [request()],
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmRequests(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListDmRequests).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
    });
    expect(result.current.requests).toEqual([request()]);
  });

  it('loads the next page with the previous next_cursor', async () => {
    mockedListDmRequests
      .mockResolvedValueOnce({
        data: [request({ id: 'req-1' })],
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        data: [request({ id: 'req-2', senderId: 'u-2', senderName: 'Bia' })],
        next_cursor: null,
      });

    const { result } = renderHook(() => useDmRequests(10), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(mockedListDmRequests).toHaveBeenNthCalledWith(2, {
        limit: 10,
        cursor: 'cursor-1',
      }),
    );
    await waitFor(() =>
      expect(result.current.requests.map((r) => r.id)).toEqual([
        'req-1',
        'req-2',
      ]),
    );
  });

  it('does not fetch while disabled', () => {
    renderHook(() => useDmRequests({ enabled: false }), {
      wrapper: makeWrapper(),
    });

    expect(mockedListDmRequests).not.toHaveBeenCalled();
  });

  it('returns an empty array when there are no requests', async () => {
    mockedListDmRequests.mockResolvedValueOnce({
      data: [],
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmRequests(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it('surfaces API errors as query error state', async () => {
    mockedListDmRequests.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useDmRequests(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network');
  });
});
