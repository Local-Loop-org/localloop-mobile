import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DmExceptionCandidate } from '@localloop/shared-types';
import { dmApi } from '@/infra/api/dm.api';
import {
  DM_EXCEPTION_CANDIDATES_KEY,
  dmExceptionCandidatesKey,
  useDmExceptionCandidates,
} from './useDmExceptionCandidates';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    listDmExceptionCandidates: jest.fn(),
  },
}));

const mockedList = dmApi.listDmExceptionCandidates as jest.MockedFunction<
  typeof dmApi.listDmExceptionCandidates
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const candidate = (
  overrides: Partial<DmExceptionCandidate> = {},
): DmExceptionCandidate => ({
  userId: 'u-1',
  displayName: 'Alice',
  avatarUrl: null,
  ...overrides,
});

describe('DM_EXCEPTION_CANDIDATES_KEY', () => {
  it('is a stable tuple', () => {
    expect(DM_EXCEPTION_CANDIDATES_KEY).toEqual(['dm', 'exception-candidates']);
  });

  it('builds q + limit query keys', () => {
    expect(dmExceptionCandidatesKey('ali', 10)).toEqual([
      'dm',
      'exception-candidates',
      'ali',
      10,
    ]);
  });
});

describe('useDmExceptionCandidates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the first page with no q by default', async () => {
    mockedList.mockResolvedValueOnce({
      data: [candidate()],
      next_cursor: null,
    });

    const { result } = renderHook(
      () => useDmExceptionCandidates({ debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedList).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
      q: undefined,
    });
    expect(result.current.candidates).toEqual([candidate()]);
  });

  it('passes a trimmed q through when present', async () => {
    mockedList.mockResolvedValueOnce({ data: [], next_cursor: null });

    renderHook(
      () => useDmExceptionCandidates({ q: '  ali  ', debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() =>
      expect(mockedList).toHaveBeenCalledWith({
        limit: 20,
        cursor: undefined,
        q: 'ali',
      }),
    );
  });

  it('omits q when blank or whitespace-only', async () => {
    mockedList.mockResolvedValueOnce({ data: [], next_cursor: null });

    renderHook(
      () => useDmExceptionCandidates({ q: '   ', debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() =>
      expect(mockedList).toHaveBeenCalledWith({
        limit: 20,
        cursor: undefined,
        q: undefined,
      }),
    );
  });

  it('loads the next page with the previous next_cursor', async () => {
    mockedList
      .mockResolvedValueOnce({
        data: [candidate({ userId: 'u-1', displayName: 'Alice' })],
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        data: [candidate({ userId: 'u-2', displayName: 'Bia' })],
        next_cursor: null,
      });

    const { result } = renderHook(
      () => useDmExceptionCandidates({ limit: 10, debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(mockedList).toHaveBeenNthCalledWith(2, {
        limit: 10,
        cursor: 'cursor-1',
        q: undefined,
      }),
    );
    await waitFor(() =>
      expect(result.current.candidates.map((c) => c.userId)).toEqual([
        'u-1',
        'u-2',
      ]),
    );
  });

  it('does not fetch while disabled', () => {
    renderHook(
      () => useDmExceptionCandidates({ enabled: false, debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    expect(mockedList).not.toHaveBeenCalled();
  });

  it('surfaces 404s as query error state for the empty-API case', async () => {
    mockedList.mockRejectedValueOnce(new Error('Request failed with status code 404'));

    const { result } = renderHook(
      () => useDmExceptionCandidates({ debounceMs: 0 }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/404/);
  });
});
