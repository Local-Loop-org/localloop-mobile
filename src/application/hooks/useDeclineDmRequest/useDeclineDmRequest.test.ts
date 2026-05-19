import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { dmApi, type ListDmRequestsResponse } from '@/infra/api/dm.api';
import { dmRequestsKey } from '../useDmRequests/useDmRequests';
import { useDeclineDmRequest } from './useDeclineDmRequest';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    declineDmRequest: jest.fn(),
  },
}));

const mockedDeclineDmRequest = dmApi.declineDmRequest as jest.MockedFunction<
  typeof dmApi.declineDmRequest
>;

const requestsData: InfiniteData<ListDmRequestsResponse> = {
  pageParams: [undefined],
  pages: [
    {
      data: [
        {
          id: 'req-1',
          senderId: 'u-1',
          senderName: 'Alice',
          senderAvatarUrl: null,
          content: 'oi',
          createdAt: '2026-05-18T10:00:00.000Z',
        },
      ],
      next_cursor: null,
    },
  ],
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(dmRequestsKey(20), requestsData);
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeclineDmRequest', () => {
  it('optimistically removes the request on decline', async () => {
    mockedDeclineDmRequest.mockResolvedValueOnce(undefined);
    const client = makeClient();
    const { result } = renderHook(() => useDeclineDmRequest(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('req-1');
    });

    await waitFor(() =>
      expect(
        client.getQueryData<InfiniteData<ListDmRequestsResponse>>(
          dmRequestsKey(20),
        )?.pages[0]?.data,
      ).toEqual([]),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedDeclineDmRequest).toHaveBeenCalledWith('req-1');
  });

  it('rolls back the removed request when decline fails', async () => {
    mockedDeclineDmRequest.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();
    const { result } = renderHook(() => useDeclineDmRequest(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('req-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<InfiniteData<ListDmRequestsResponse>>(
        dmRequestsKey(20),
      ),
    ).toEqual(requestsData);
  });
});
