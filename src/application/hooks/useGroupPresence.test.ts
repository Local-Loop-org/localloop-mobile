import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { MyGroup } from '@/infra/api/groups.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { myGroupsKey } from './useMyGroups';
import { useGroupPresence } from './useGroupPresence';

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

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function makeWrapper(client = makeClient()) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const sampleGroup: MyGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  memberCount: 5,
  myRole: MemberRole.MEMBER,
  lastActivityAt: '2026-04-24T10:00:00.000Z',
  lastMessage: null,
  lastReadAt: '2026-04-24T09:00:00.000Z',
  unreadCount: 1,
};

describe('useGroupPresence', () => {
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

  it('connects and watches the unique visible group ids on socket connect', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useGroupPresence(['g-2', 'g-1', 'g-1']), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );
    act(() => {
      fire('connect');
    });

    expect(mock.emit).toHaveBeenCalledWith('watch_presence', {
      groupIds: ['g-1', 'g-2'],
    });
    expect(mock.emit).toHaveBeenCalledWith('watch_group_summaries', {
      groupIds: ['g-1', 'g-2'],
    });
  });

  it('updates counts from presence_update events and ignores unwatched groups', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupPresence(['g-1']), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire('presence_update', { groupId: 'g-other', count: 99 });
    });
    expect(result.current).toEqual({});

    act(() => {
      fire('presence_update', { groupId: 'g-1', count: 3 });
    });
    await waitFor(() => expect(result.current['g-1']).toBe(3));
  });

  it('writes group_summary_update events into my-groups caches', async () => {
    const client = makeClient();
    client.setQueryData(myGroupsKey(5), [sampleGroup]);
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useGroupPresence(['g-1']), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire('group_summary_update', {
        groupId: 'g-1',
        lastActivityAt: '2026-04-24T11:00:00.000Z',
        lastMessage: {
          content: 'Cheguei',
          senderName: 'Alice',
          createdAt: '2026-04-24T11:00:00.000Z',
        },
        lastReadAt: '2026-04-24T09:00:00.000Z',
        unreadCount: 2,
      });
    });

    await waitFor(() =>
      expect(client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0]).toMatchObject(
        {
          lastActivityAt: '2026-04-24T11:00:00.000Z',
          unreadCount: 2,
          lastMessage: { content: 'Cheguei' },
        },
      ),
    );
  });

  it('unwatches and disconnects on cleanup', async () => {
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { unmount } = renderHook(() => useGroupPresence(['g-1', 'g-2']), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith('unwatch_presence', {
      groupIds: ['g-1', 'g-2'],
    });
    expect(mock.emit).toHaveBeenCalledWith('unwatch_group_summaries', {
      groupIds: ['g-1', 'g-2'],
    });
    expect(mock.removeAllListeners).toHaveBeenCalled();
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('does not create a socket without a token or watched group ids', () => {
    useAuthStore.setState({ accessToken: null } as never);

    renderHook(() => useGroupPresence(['g-1']), { wrapper: makeWrapper() });
    renderHook(() => useGroupPresence([]), { wrapper: makeWrapper() });

    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });
});
