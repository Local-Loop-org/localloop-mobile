import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmConversationDto,
  type ListDmConversationsResponse,
} from '@/infra/api/dm.api';
import {
  applyDmSummaryUpdate,
  DM_CONVERSATIONS_KEY,
  dmConversationsKey,
  markDmReadInCaches,
  setDmArchivedInCaches,
  useDmConversations,
} from './useDmConversations';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    listDmConversations: jest.fn(),
  },
}));

const mockedListDmConversations =
  dmApi.listDmConversations as jest.MockedFunction<
    typeof dmApi.listDmConversations
  >;

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function makeWrapper(client = makeClient()) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

function seedConversations(client: QueryClient, rows: DmConversationDto[]) {
  client.setQueryData<InfiniteData<ListDmConversationsResponse>>(
    dmConversationsKey(20),
    {
      pageParams: [undefined],
      pages: [{ data: rows, next_cursor: null }],
    },
  );
}

const conversation = (
  overrides: Partial<DmConversationDto> = {},
): DmConversationDto => ({
  peerId: 'u-1',
  peerName: 'Alice',
  peerAvatarUrl: null,
  lastMessage: {
    content: 'oi',
    senderName: 'Alice',
    createdAt: '2026-05-18T10:00:00.000Z',
  },
  unreadCount: 0,
  archived: false,
  ...overrides,
});

describe('DM_CONVERSATIONS_KEY', () => {
  it('is a stable tuple', () => {
    expect(DM_CONVERSATIONS_KEY).toEqual(['dm', 'conversations']);
  });

  it('builds limit-specific query keys', () => {
    expect(dmConversationsKey(10)).toEqual(['dm', 'conversations', 10]);
  });
});

describe('useDmConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and flattens the first page', async () => {
    mockedListDmConversations.mockResolvedValueOnce({
      data: [conversation()],
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmConversations(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListDmConversations).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
    });
    expect(result.current.conversations).toEqual([conversation()]);
  });

  it('loads the next page with the previous next_cursor', async () => {
    mockedListDmConversations
      .mockResolvedValueOnce({
        data: [conversation({ peerId: 'u-1', peerName: 'Alice' })],
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        data: [conversation({ peerId: 'u-2', peerName: 'Bia' })],
        next_cursor: null,
      });

    const { result } = renderHook(() => useDmConversations(10), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(mockedListDmConversations).toHaveBeenNthCalledWith(2, {
        limit: 10,
        cursor: 'cursor-1',
      }),
    );
    await waitFor(() =>
      expect(result.current.conversations.map((c) => c.peerId)).toEqual([
        'u-1',
        'u-2',
      ]),
    );
  });

  it('does not fetch while disabled', () => {
    renderHook(() => useDmConversations({ enabled: false }), {
      wrapper: makeWrapper(),
    });

    expect(mockedListDmConversations).not.toHaveBeenCalled();
  });

  it('returns an empty array for an empty inbox', async () => {
    mockedListDmConversations.mockResolvedValueOnce({
      data: [],
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmConversations(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.conversations).toEqual([]);
  });

  it('surfaces API errors as query error state', async () => {
    mockedListDmConversations.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useDmConversations(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network');
  });
});

describe('DM conversation cache helpers', () => {
  it('applies summary updates, preserves identity fields, and sorts by activity', () => {
    const client = makeClient();
    seedConversations(client, [
      conversation({
        peerId: 'u-1',
        peerName: 'Alice',
        unreadCount: 4,
        lastMessage: {
          content: 'old',
          senderName: 'Alice',
          createdAt: '2026-05-18T10:00:00.000Z',
        },
      }),
      conversation({
        peerId: 'u-2',
        peerName: 'Bia',
        lastMessage: {
          content: 'newer',
          senderName: 'Bia',
          createdAt: '2026-05-18T11:00:00.000Z',
        },
      }),
    ]);

    const touched = applyDmSummaryUpdate(client, {
      peerId: 'u-1',
      lastActivityAt: '2026-05-18T12:00:00.000Z',
      lastReadAt: '2026-05-18T12:01:00.000Z',
      lastMessage: {
        content: 'fresh',
        senderName: 'Alice',
        createdAt: '2026-05-18T12:00:00.000Z',
      },
      unreadCount: 0,
      archived: true,
    });

    const rows =
      client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
        dmConversationsKey(20),
      )?.pages[0].data ?? [];

    expect(touched).toBe(true);
    expect(rows[0]).toMatchObject({
      peerId: 'u-1',
      peerName: 'Alice',
      lastReadAt: '2026-05-18T12:01:00.000Z',
      unreadCount: 0,
      archived: true,
      lastMessage: { content: 'fresh' },
    });
  });

  it('invalidates conversations when a summary references an unloaded peer', () => {
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    seedConversations(client, [conversation({ peerId: 'u-1' })]);

    const touched = applyDmSummaryUpdate(client, {
      peerId: 'u-missing',
      lastActivityAt: '2026-05-18T12:00:00.000Z',
      lastReadAt: null,
      lastMessage: {
        content: 'fresh',
        senderName: 'Missing',
        createdAt: '2026-05-18T12:00:00.000Z',
      },
      unreadCount: 1,
      archived: false,
    });

    expect(touched).toBe(false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: DM_CONVERSATIONS_KEY });
  });

  it('marks a DM read and toggles archived state optimistically', () => {
    const client = makeClient();
    seedConversations(client, [
      conversation({ peerId: 'u-1', unreadCount: 3, archived: false }),
    ]);

    markDmReadInCaches(client, 'u-1');
    setDmArchivedInCaches(client, 'u-1', true);

    expect(
      client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
        dmConversationsKey(20),
      )?.pages[0].data[0],
    ).toMatchObject({ unreadCount: 0, archived: true });
  });
});
