import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ChatSocketEvents } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type {
  DmConversationDto,
  ListDmConversationsResponse,
} from '@/infra/api/dm.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import {
  DM_CONVERSATIONS_KEY,
  dmConversationsKey,
} from '../useDmConversations/useDmConversations';
import { useDmInboxRealtime } from './useDmInboxRealtime';

jest.mock('@/infra/socket/chat-socket', () => ({
  createChatSocket: jest.fn(),
}));

type SocketHandler = (...args: unknown[]) => void;

function makeSocketMock() {
  const handlers = new Map<string, SocketHandler>();
  const emit = jest.fn();
  const on = jest.fn((event: string, handler: SocketHandler) => {
    handlers.set(event, handler);
  });
  const removeAllListeners = jest.fn();
  const disconnect = jest.fn();
  return {
    mock: { emit, on, removeAllListeners, disconnect },
    fire: (event: string, payload?: unknown) => {
      handlers.get(event)?.(payload);
    },
  };
}

const mockedCreateChatSocket = createChatSocket as jest.Mock;

const conversation: DmConversationDto = {
  peerId: 'u-1',
  peerName: 'Alice',
  peerAvatarUrl: null,
  lastMessage: {
    content: 'old',
    senderName: 'Alice',
    createdAt: '2026-05-18T10:00:00.000Z',
  },
  unreadCount: 1,
  archived: false,
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData<InfiniteData<ListDmConversationsResponse>>(
    dmConversationsKey(20),
    {
      pageParams: [undefined],
      pages: [{ data: [conversation], next_cursor: null }],
    },
  );
  return client;
}

function makeWrapper(client = makeClient()) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('useDmInboxRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'me',
        displayName: 'Me',
        avatarUrl: null,
      } as never,
      accessToken: 'tok',
      refreshToken: 'ref',
      isAuthenticated: true,
      isNewUser: false,
    });
  });

  it('watches the caller DM inbox on connect', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );

    act(() => {
      fire('connect');
    });

    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.WATCH_DM_INBOX, {});
  });

  it('applies dm_summary_update payloads to conversation caches', async () => {
    const client = makeClient();
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
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
    });

    await waitFor(() =>
      expect(
        client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
          dmConversationsKey(20),
        )?.pages[0].data[0],
      ).toMatchObject({
        lastReadAt: '2026-05-18T12:01:00.000Z',
        unreadCount: 0,
        archived: true,
        lastMessage: { content: 'fresh' },
      }),
    );
  });

  it('invalidates conversations when a request is accepted on another device', async () => {
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire(ChatSocketEvents.DM_REQUEST_ACCEPTED, {
        id: 'dm-1',
        senderId: 'me',
        senderName: 'Me',
        senderAvatar: null,
        recipientId: 'u-2',
        content: 'oi',
        mediaUrl: null,
        mediaType: null,
        createdAt: '2026-05-18T12:00:00.000Z',
      });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: DM_CONVERSATIONS_KEY,
    });
  });

  it('unwatches and disconnects on cleanup', async () => {
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { unmount } = renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_INBOX,
      {},
    );
    expect(mock.removeAllListeners).toHaveBeenCalled();
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('does not create a socket when disabled or unauthenticated', () => {
    const { unmount } = renderHook(() => useDmInboxRealtime({ enabled: false }), {
      wrapper: makeWrapper(),
    });
    unmount();

    act(() => {
      useAuthStore.setState({ accessToken: null } as never);
    });
    renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(),
    });

    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });
});
