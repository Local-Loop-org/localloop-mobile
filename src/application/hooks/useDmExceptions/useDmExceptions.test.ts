import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dmApi, type DmExceptionDto } from '@/infra/api/dm.api';
import {
  DM_EXCEPTIONS_KEY,
  dmExceptionsKey,
  useDmExceptions,
} from './useDmExceptions';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    listDmExceptions: jest.fn(),
  },
}));

const mockedListDmExceptions = dmApi.listDmExceptions as jest.MockedFunction<
  typeof dmApi.listDmExceptions
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const exception = (
  overrides: Partial<DmExceptionDto> = {},
): DmExceptionDto => ({
  peerId: 'u-1',
  displayName: 'Alice',
  avatarUrl: null,
  createdAt: '2026-05-18T10:00:00.000Z',
  ...overrides,
});

describe('DM_EXCEPTIONS_KEY', () => {
  it('is a stable tuple', () => {
    expect(DM_EXCEPTIONS_KEY).toEqual(['dm', 'exceptions']);
  });

  it('builds limit-specific query keys', () => {
    expect(dmExceptionsKey(10)).toEqual(['dm', 'exceptions', 10]);
  });
});

describe('useDmExceptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and flattens the first page', async () => {
    mockedListDmExceptions.mockResolvedValueOnce({
      data: [exception()],
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmExceptions(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListDmExceptions).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
    });
    expect(result.current.exceptions).toEqual([exception()]);
  });

  it('loads the next page with the previous next_cursor', async () => {
    mockedListDmExceptions
      .mockResolvedValueOnce({
        data: [exception({ peerId: 'u-1', displayName: 'Alice' })],
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        data: [exception({ peerId: 'u-2', displayName: 'Bia' })],
        next_cursor: null,
      });

    const { result } = renderHook(() => useDmExceptions(10), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(mockedListDmExceptions).toHaveBeenNthCalledWith(2, {
        limit: 10,
        cursor: 'cursor-1',
      }),
    );
    await waitFor(() =>
      expect(result.current.exceptions.map((e) => e.peerId)).toEqual([
        'u-1',
        'u-2',
      ]),
    );
  });

  it('does not fetch while disabled', () => {
    renderHook(() => useDmExceptions({ enabled: false }), {
      wrapper: makeWrapper(),
    });

    expect(mockedListDmExceptions).not.toHaveBeenCalled();
  });

  it('surfaces API errors as query error state', async () => {
    mockedListDmExceptions.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useDmExceptions(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network');
  });
});
