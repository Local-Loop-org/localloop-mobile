import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  ChatSocketEvents,
  MemberRole,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import type { MyGroup } from '@/infra/api/groups.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { myGroupsKey } from '../useMyGroups/useMyGroups';
import { useGroupListRealtime } from './useGroupListRealtime';

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

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
  lastReadAt: '2026-04-24T09:00:00.000Z',
  lastMessage: null,
  unreadCount: 1,
};

describe('useGroupListRealtime', () => {
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
    handle.setConnected(true);
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  it('watches normalized presence and summary ids when connected', () => {
    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['p-2', 'p-1', 'p-1'],
          summaryGroupIds: ['s-2', 's-1', 's-1'],
        }),
      { wrapper: makeWrapper() },
    );

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_PRESENCE,
      { groupIds: ['p-1', 'p-2'] },
    );
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_GROUP_SUMMARIES,
      { groupIds: ['s-1', 's-2'] },
    );
  });

  it('updates counts from presence_update events and ignores unwatched groups', async () => {
    const { result } = renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1'],
          summaryGroupIds: [],
        }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      handle.fire(ChatSocketEvents.PRESENCE_UPDATE, {
        groupId: 'g-other',
        count: 99,
      });
    });
    expect(result.current).toEqual({});

    act(() => {
      handle.fire(ChatSocketEvents.PRESENCE_UPDATE, {
        groupId: 'g-1',
        count: 3,
      });
    });
    await waitFor(() => expect(result.current['g-1']).toBe(3));
  });

  it('writes summary updates only for watched summary ids', async () => {
    const client = makeClient();
    client.setQueryData(myGroupsKey(5), [sampleGroup]);

    renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: [],
          summaryGroupIds: ['g-1'],
        }),
      { wrapper: makeWrapper(client) },
    );

    act(() => {
      handle.fire(ChatSocketEvents.GROUP_SUMMARY_UPDATE, {
        groupId: 'g-other',
        lastActivityAt: '2026-04-24T12:00:00.000Z',
        lastReadAt: '2026-04-24T11:00:00.000Z',
        lastMessage: null,
        unreadCount: 99,
      });
    });
    expect(
      client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0].unreadCount,
    ).toBe(1);

    act(() => {
      handle.fire(ChatSocketEvents.GROUP_SUMMARY_UPDATE, {
        groupId: 'g-1',
        lastActivityAt: '2026-04-24T11:00:00.000Z',
        lastReadAt: '2026-04-24T10:45:00.000Z',
        lastMessage: {
          content: 'Cheguei',
          senderName: 'Alice',
          createdAt: '2026-04-24T11:00:00.000Z',
        },
        unreadCount: 2,
      });
    });

    await waitFor(() =>
      expect(
        client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0],
      ).toMatchObject({
        lastActivityAt: '2026-04-24T11:00:00.000Z',
        lastReadAt: '2026-04-24T10:45:00.000Z',
        unreadCount: 2,
        lastMessage: { content: 'Cheguei' },
      }),
    );
  });

  it('unwatches presence and summaries on cleanup', () => {
    const { unmount } = renderHook(
      () =>
        useGroupListRealtime({
          presenceGroupIds: ['g-1', 'g-2'],
          summaryGroupIds: ['g-2', 'g-3'],
        }),
      { wrapper: makeWrapper() },
    );

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_PRESENCE,
      { groupIds: ['g-1', 'g-2'] },
    );
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_GROUP_SUMMARIES,
      { groupIds: ['g-2', 'g-3'] },
    );
  });

  it('does not subscribe with no watched ids or when disabled', () => {
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

    expect(handle.manager.subscribe).not.toHaveBeenCalled();
  });
});
