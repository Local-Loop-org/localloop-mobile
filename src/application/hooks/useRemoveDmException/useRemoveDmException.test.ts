import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { dmApi, type ListDmExceptionsResponse } from '@/infra/api/dm.api';
import { dmExceptionsKey } from '../useDmExceptions/useDmExceptions';
import { useRemoveDmException } from './useRemoveDmException';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    removeDmException: jest.fn(),
  },
}));

const mockedRemoveDmException = dmApi.removeDmException as jest.MockedFunction<
  typeof dmApi.removeDmException
>;

const exceptionsData: InfiniteData<ListDmExceptionsResponse> = {
  pageParams: [undefined],
  pages: [
    {
      data: [
        {
          peerId: 'u-1',
          displayName: 'Alice',
          avatarUrl: null,
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
  client.setQueryData(dmExceptionsKey(20), exceptionsData);
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useRemoveDmException', () => {
  it('optimistically removes the exception', async () => {
    mockedRemoveDmException.mockResolvedValueOnce(undefined);
    const client = makeClient();
    const { result } = renderHook(() => useRemoveDmException(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() =>
      expect(
        client.getQueryData<InfiniteData<ListDmExceptionsResponse>>(
          dmExceptionsKey(20),
        )?.pages[0]?.data,
      ).toEqual([]),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedRemoveDmException).toHaveBeenCalledWith('u-1');
  });

  it('rolls back the exception when removal fails', async () => {
    mockedRemoveDmException.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();
    const { result } = renderHook(() => useRemoveDmException(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<InfiniteData<ListDmExceptionsResponse>>(
        dmExceptionsKey(20),
      ),
    ).toEqual(exceptionsData);
  });
});
