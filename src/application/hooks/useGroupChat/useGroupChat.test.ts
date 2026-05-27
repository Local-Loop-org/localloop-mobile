import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  ChatSocketEvents,
  MemberRole,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { messagesApi, ChatMessage } from '@/infra/api/messages.api';
import {
  groupsApi,
  type GroupSummaryUpdate,
  type MyGroup,
} from '@/infra/api/groups.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { useGroupChat } from './useGroupChat';
import { useJoinGroup } from '../useJoinGroup/useJoinGroup';
import { MY_GROUPS_KEY, myGroupsKey } from '../useMyGroups/useMyGroups';

jest.mock('@/infra/api/messages.api', () => ({
  messagesApi: {
    getHistory: jest.fn(),
  },
}));

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    joinGroup: jest.fn(),
  },
}));

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

type MarkReadAck = (error: Error | null, payload?: GroupSummaryUpdate) => void;

const mockedGetHistory = messagesApi.getHistory as jest.Mock;
const mockedJoinGroup = groupsApi.joinGroup as jest.Mock;
const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

const baseMessage = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  senderId: 'u-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  content: 'hello',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  ...over,
});

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function makeWrapper(client = makeClient()) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const baseMyGroup = (overrides: Partial<MyGroup> = {}): MyGroup => ({
  id: 'g-1',
  name: 'Morumbi Runners',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  memberCount: 5,
  myRole: MemberRole.MEMBER,
  lastActivityAt: '2026-04-24T09:00:00.000Z',
  lastReadAt: '2026-04-24T08:00:00.000Z',
  lastMessage: null,
  unreadCount: 3,
  ...overrides,
});

function attachAckCapture(handle: ManagerMockHandle): {
  ackMarkRead: (error: Error | null, payload?: GroupSummaryUpdate) => void;
} {
  const acks: MarkReadAck[] = [];
  (handle.manager.emitWithAck as jest.Mock).mockImplementation(
    (
      event: string,
      _payload: unknown,
      _timeoutMs: number,
      cb: MarkReadAck,
    ) => {
      if (event === ChatSocketEvents.MARK_GROUP_READ) {
        acks.push(cb);
      }
    },
  );
  return {
    ackMarkRead: (error, payload) => {
      acks[acks.length - 1]?.(error, payload);
    },
  };
}

describe('useGroupChat', () => {
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

  it('loads history, joins the group, and emits mark_group_read with ack', async () => {
    mockedGetHistory.mockResolvedValueOnce({
      data: [baseMessage()],
      next_cursor: null,
    });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(1);

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.JOIN_GROUP,
      { groupId: 'g-1' },
    );
    expect(handle.manager.emitWithAck).toHaveBeenCalledWith(
      ChatSocketEvents.MARK_GROUP_READ,
      { groupId: 'g-1' },
      4_000,
      expect.any(Function),
    );
    expect(result.current.connected).toBe(true);
  });

  it('clears unread cache on chat entry and applies the mark-read summary ack', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const client = makeClient();
    client.setQueryData(myGroupsKey(5), [baseMyGroup()]);
    const { ackMarkRead } = attachAckCapture(handle);

    renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() =>
      expect(handle.manager.emitWithAck).toHaveBeenCalled(),
    );

    expect(
      client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0],
    ).toMatchObject({
      unreadCount: 0,
      lastMessage: null,
    });

    act(() => {
      ackMarkRead(null, {
        groupId: 'g-1',
        lastActivityAt: '2026-04-24T10:30:00.000Z',
        lastReadAt: '2026-04-24T10:31:00.000Z',
        lastMessage: {
          content: 'Tudo certo',
          senderName: 'Alice',
          createdAt: '2026-04-24T10:30:00.000Z',
        },
        unreadCount: 0,
      });
    });

    await waitFor(() =>
      expect(
        client.getQueryData<MyGroup[]>(myGroupsKey(5))?.[0],
      ).toMatchObject({
        lastActivityAt: '2026-04-24T10:30:00.000Z',
        lastReadAt: '2026-04-24T10:31:00.000Z',
        lastMessage: { content: 'Tudo certo' },
        unreadCount: 0,
      }),
    );
  });

  it('invalidates my-groups when mark-read ack errors', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { ackMarkRead } = attachAckCapture(handle);

    renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() =>
      expect(handle.manager.emitWithAck).toHaveBeenCalled(),
    );

    act(() => {
      ackMarkRead(new Error('operation has timed out'));
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: MY_GROUPS_KEY });
  });

  it('does not register a listener for group_summary_update', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    renderHook(() => useGroupChat('g-1'), { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(handle.manager.emitWithAck).toHaveBeenCalled(),
    );

    expect(handle.listenerCount(ChatSocketEvents.GROUP_SUMMARY_UPDATE)).toBe(
      0,
    );
  });

  it('appends new_message events to the front of the list and dedupes by id', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const incoming = baseMessage({ id: 'm-2', content: 'first' });
    act(() => {
      handle.fire(ChatSocketEvents.NEW_MESSAGE, incoming);
    });
    await waitFor(() => expect(result.current.messages[0]?.id).toBe('m-2'));
    expect(handle.manager.emitWithAck).toHaveBeenCalledWith(
      ChatSocketEvents.MARK_GROUP_READ,
      { groupId: 'g-1' },
      4_000,
      expect.any(Function),
    );

    const second = baseMessage({ id: 'm-3', content: 'second' });
    act(() => {
      handle.fire(ChatSocketEvents.NEW_MESSAGE, second);
    });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual(['m-3', 'm-2']),
    );

    act(() => {
      handle.fire(ChatSocketEvents.NEW_MESSAGE, second);
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('sendMessage optimistically prepends a temp message and emits send_message', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('  hi  ');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const temp = result.current.messages[0];
    expect(temp.id.startsWith('temp-')).toBe(true);
    expect(temp.content).toBe('hi');
    expect(temp.senderId).toBe('me');

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.SEND_MESSAGE,
      {
        groupId: 'g-1',
        content: 'hi',
        storageKey: null,
        mediaType: null,
      },
    );
  });

  it('reconciles the server echo with an optimistic temp (same senderId + content)', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('hello world');
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].id.startsWith('temp-')).toBe(true);

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_MESSAGE,
        baseMessage({
          id: 'server-uuid-1',
          senderId: 'me',
          senderName: 'Me',
          content: 'hello world',
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.messages[0]?.id).toBe('server-uuid-1'),
    );
    expect(result.current.messages).toHaveLength(1);
  });

  it('loadOlder fetches the next page using the previous next_cursor', async () => {
    mockedGetHistory
      .mockResolvedValueOnce({
        data: [baseMessage({ id: 'm-new' })],
        next_cursor: '2026-04-24T09:59:00.000Z',
      })
      .mockResolvedValueOnce({
        data: [
          baseMessage({ id: 'm-older', createdAt: '2026-04-24T09:00:00.000Z' }),
        ],
        next_cursor: null,
      });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadOlder();
    });

    await waitFor(() =>
      expect(mockedGetHistory).toHaveBeenNthCalledWith(2, 'g-1', {
        before: '2026-04-24T09:59:00.000Z',
      }),
    );
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'm-new',
        'm-older',
      ]),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it('sendMessage is a no-op for empty or whitespace-only input', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    (handle.manager.emit as jest.Mock).mockClear();
    act(() => {
      result.current.sendMessage('   ');
    });
    expect(handle.manager.emit).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it('emits leave_group on unmount', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result, unmount } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.LEAVE_GROUP,
      { groupId: 'g-1' },
    );
  });

  it('sets error=load_failed when initial history fetch throws', async () => {
    mockedGetHistory.mockRejectedValueOnce(new Error('boom'));
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('load_failed');
    expect(handle.manager.subscribe).not.toHaveBeenCalled();
  });

  it('starts onlineCount at 0 and updates on presence_update events for the same group', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.onlineCount).toBe(0);

    act(() => {
      handle.fire(ChatSocketEvents.PRESENCE_UPDATE, {
        groupId: 'g-1',
        count: 3,
      });
    });
    await waitFor(() => expect(result.current.onlineCount).toBe(3));

    act(() => {
      handle.fire(ChatSocketEvents.PRESENCE_UPDATE, {
        groupId: 'g-1',
        count: 5,
      });
    });
    await waitFor(() => expect(result.current.onlineCount).toBe(5));
  });

  it('ignores presence_update events for other groups', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      handle.fire(ChatSocketEvents.PRESENCE_UPDATE, {
        groupId: 'g-OTHER',
        count: 99,
      });
    });

    expect(result.current.onlineCount).toBe(0);
  });

  it('gates history fetch and subscription while a join-group mutation for the same id is pending', async () => {
    let resolveJoin: (v: {
      status: 'joined';
      role: MemberRole;
    }) => void = () => {};
    mockedJoinGroup.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveJoin = resolve;
        }),
    );
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const sharedWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);

    const { result: joinResult } = renderHook(() => useJoinGroup(), {
      wrapper: sharedWrapper,
    });
    act(() => {
      joinResult.current.mutate({
        groupId: 'g-1',
        group: {
          id: 'g-1',
          name: 'Morumbi Runners',
          anchorType: AnchorType.NEIGHBORHOOD,
          anchorLabel: 'Morumbi',
          memberCount: 5,
        },
      });
    });
    await waitFor(() => expect(joinResult.current.isPending).toBe(true));

    const { result: chatResult } = renderHook(() => useGroupChat('g-1'), {
      wrapper: sharedWrapper,
    });

    expect(chatResult.current.loading).toBe(true);
    expect(mockedGetHistory).not.toHaveBeenCalled();
    expect(handle.manager.subscribe).not.toHaveBeenCalled();

    await act(async () => {
      resolveJoin({ status: 'joined', role: MemberRole.MEMBER });
    });

    await waitFor(() => expect(mockedGetHistory).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(handle.manager.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'group:join:g-1' }),
      ),
    );
  });
});
