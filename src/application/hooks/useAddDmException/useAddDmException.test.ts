import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { dmApi, type ListDmExceptionsResponse } from '@/infra/api/dm.api';
import {
  dmExceptionCandidatesKey,
  DM_EXCEPTION_CANDIDATES_KEY,
} from '../useDmExceptionCandidates/useDmExceptionCandidates';
import { dmExceptionsKey } from '../useDmExceptions/useDmExceptions';
import { useAddDmException } from './useAddDmException';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    addDmException: jest.fn(),
  },
}));

const mockedAdd = dmApi.addDmException as jest.MockedFunction<
  typeof dmApi.addDmException
>;

const seededExceptions: InfiniteData<ListDmExceptionsResponse> = {
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
  client.setQueryData(dmExceptionsKey(20), seededExceptions);
  client.setQueryData(dmExceptionCandidatesKey('', 20), {
    pageParams: [undefined],
    pages: [{ data: [], next_cursor: null }],
  });
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAddDmException', () => {
  it('optimistically prepends the new exception', async () => {
    mockedAdd.mockResolvedValueOnce(undefined);
    const client = makeClient();
    const { result } = renderHook(() => useAddDmException(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({
        peerId: 'u-2',
        displayName: 'Bia',
        avatarUrl: null,
      });
    });

    await waitFor(() =>
      expect(
        client
          .getQueryData<InfiniteData<ListDmExceptionsResponse>>(
            dmExceptionsKey(20),
          )
          ?.pages[0]?.data.map((e) => e.peerId),
      ).toEqual(['u-2', 'u-1']),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedAdd).toHaveBeenCalledWith('u-2');
  });

  it('rolls back when the request fails', async () => {
    mockedAdd.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();
    const { result } = renderHook(() => useAddDmException(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({
        peerId: 'u-2',
        displayName: 'Bia',
        avatarUrl: null,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<InfiniteData<ListDmExceptionsResponse>>(
        dmExceptionsKey(20),
      ),
    ).toEqual(seededExceptions);
  });

  it('invalidates exceptions and candidates caches on settle', async () => {
    mockedAdd.mockResolvedValueOnce(undefined);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAddDmException(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({
        peerId: 'u-3',
        displayName: 'Caio',
        avatarUrl: null,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calls = invalidate.mock.calls.map(([arg]) => arg);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ queryKey: ['dm', 'exceptions'] }),
        expect.objectContaining({
          queryKey: DM_EXCEPTION_CANDIDATES_KEY,
        }),
      ]),
    );
  });
});
