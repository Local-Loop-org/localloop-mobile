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
import { dmConversationsKey } from '../useDmConversations/useDmConversations';
import { useUnarchiveDmConversation } from './useUnarchiveDmConversation';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    unarchiveDmConversation: jest.fn(),
  },
}));

const mockedUnarchiveDmConversation =
  dmApi.unarchiveDmConversation as jest.MockedFunction<
    typeof dmApi.unarchiveDmConversation
  >;

const conversation: DmConversationDto = {
  peerId: 'u-1',
  peerName: 'Alice',
  peerAvatarUrl: null,
  lastMessage: {
    content: 'oi',
    senderName: 'Alice',
    createdAt: '2026-05-18T10:00:00.000Z',
  },
  unreadCount: 2,
  archived: true,
};

const conversationsData: InfiniteData<ListDmConversationsResponse> = {
  pageParams: [undefined],
  pages: [{ data: [conversation], next_cursor: null }],
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(dmConversationsKey(20), conversationsData);
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('useUnarchiveDmConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically unarchives the conversation', async () => {
    mockedUnarchiveDmConversation.mockResolvedValueOnce(undefined);
    const client = makeClient();
    const { result } = renderHook(() => useUnarchiveDmConversation(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() =>
      expect(
        client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
          dmConversationsKey(20),
        )?.pages[0]?.data[0]?.archived,
      ).toBe(false),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedUnarchiveDmConversation).toHaveBeenCalledWith('u-1');
  });

  it('rolls back when unarchive fails', async () => {
    mockedUnarchiveDmConversation.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();
    const { result } = renderHook(() => useUnarchiveDmConversation(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
        dmConversationsKey(20),
      ),
    ).toEqual(conversationsData);
  });
});
