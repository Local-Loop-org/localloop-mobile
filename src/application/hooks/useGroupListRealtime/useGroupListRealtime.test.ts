import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { MyGroup } from '@/infra/api/groups.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { myGroupsKey } from '../useMyGroups/useMyGroups';
import { useGroupListRealtime } from './useGroupListRealtime';

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
  unreadCount: 1,
};

describe('useGroupListRealtime', () => {
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

  it('watches normalized presence and summary ids on socket connect', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['p-2', 'p-1', 'p-1'],
          summaryGroupIds: ['s-2', 's-1', 's-1'],
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );
    act(() => {
      fire('connect');
    });

    expect(mock.emit).toHaveBeenCalledWith('watch_presence', {
      groupIds: ['p-1', 'p-2'],
    });
    expect(mock.emit).toHaveBeenCalledWith('watch_group_summaries', {
      groupIds: ['s-1', 's-2'],
    });
  });

  it('updates counts from presence_update events and ignores unwatched groups', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1'],
          summaryGroupIds: [],
        }),
      { wrapper: makeWrapper() },
    );
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

  it('writes summary updates only for watched summary ids', async () => {
    const client = makeClient();
    client.setQueryData(myGroupsKey(5), [sampleGroup]);
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: [],
          summaryGroupIds: ['g-1'],
        }),
      { wrapper: makeWrapper(client) },
    );
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire('group_summary_update', {
        groupId: 'g-other',
        lastActivityAt: '2026-04-24T12:00:00.000Z',
        lastMessage: null,
        unreadCount: 99,
      });
    });
    expect(client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0].unreadCount).toBe(
      1,
    );

    act(() => {
      fire('group_summary_update', {
        groupId: 'g-1',
        lastActivityAt: '2026-04-24T11:00:00.000Z',
        lastMessage: {
          content: 'Cheguei',
          senderName: 'Alice',
          createdAt: '2026-04-24T11:00:00.000Z',
        },
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

    const { unmount } = renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1', 'g-2'],
          summaryGroupIds: ['g-2', 'g-3'],
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith('unwatch_presence', {
      groupIds: ['g-1', 'g-2'],
    });
    expect(mock.emit).toHaveBeenCalledWith('unwatch_group_summaries', {
      groupIds: ['g-2', 'g-3'],
    });
    expect(mock.removeAllListeners).toHaveBeenCalled();
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('does not create a socket without token, watched ids, or enabled state', () => {
    useAuthStore.setState({ accessToken: null } as never);

    const withoutToken = renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1'],
          summaryGroupIds: ['g-1'],
        }),
      { wrapper: makeWrapper() },
    );
    withoutToken.unmount();

    act(() => {
      useAuthStore.setState({ accessToken: 'tok' } as never);
    });
    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: [],
          summaryGroupIds: [],
        }),
      { wrapper: makeWrapper() },
    );
    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1'],
          summaryGroupIds: ['g-1'],
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    );

    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });
});
