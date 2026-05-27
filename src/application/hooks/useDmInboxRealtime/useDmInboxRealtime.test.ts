import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
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
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import {
  DM_CONVERSATIONS_KEY,
  dmConversationsKey,
} from '../useDmConversations/useDmConversations';
import { useDmInboxRealtime } from './useDmInboxRealtime';

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

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
  let handle: ManagerMockHandle;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'me', displayName: 'Me', avatarUrl: null } as never,
      accessToken: 'tok',
      refreshToken: 'ref',
      isAuthenticated: true,
      isNewUser: false,
    });
    handle = makeManagerMock();
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  it('subscribes to the DM inbox once mounted and connected', () => {
    handle.setConnected(true);
    renderHook(() => useDmInboxRealtime(), { wrapper: makeWrapper() });

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_INBOX,
      {},
    );
  });

  it('applies dm_summary_update payloads to conversation caches', () => {
    const client = makeClient();
    handle.setConnected(true);
    renderHook(() => useDmInboxRealtime(), { wrapper: makeWrapper(client) });

    act(() => {
      handle.fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
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

    expect(
      client.getQueryData<InfiniteData<ListDmConversationsResponse>>(
        dmConversationsKey(20),
      )?.pages[0].data[0],
    ).toMatchObject({
      lastReadAt: '2026-05-18T12:01:00.000Z',
      unreadCount: 0,
      archived: true,
      lastMessage: { content: 'fresh' },
    });
  });

  it('invalidates conversations when a request is accepted on another device', () => {
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    handle.setConnected(true);
    renderHook(() => useDmInboxRealtime(), { wrapper: makeWrapper(client) });

    act(() => {
      handle.fire(ChatSocketEvents.DM_REQUEST_ACCEPTED, {
        id: 'dm-1',
        senderId: 'me',
        senderName: 'Me',
        senderAvatarUrl: null,
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

  it('unsubscribes the inbox on unmount', () => {
    handle.setConnected(true);
    const { unmount } = renderHook(() => useDmInboxRealtime(), {
      wrapper: makeWrapper(),
    });

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_INBOX,
      {},
    );
  });

  it('does not subscribe when disabled', () => {
    handle.setConnected(true);
    renderHook(() => useDmInboxRealtime({ enabled: false }), {
      wrapper: makeWrapper(),
    });

    expect(handle.manager.subscribe).not.toHaveBeenCalled();
  });
});
