import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  ChatSocketEvents,
  type GroupMessage,
  MemberRole,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { messagesApi } from '@/infra/api/messages.api';
import {
  groupsApi,
  type GroupSummaryUpdate,
  type MyGroup,
} from '@/infra/api/groups.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import type { ChatMessageWithSendStatus } from '@/shared/chat/sendStatus';
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
type GroupMessageWithSendStatus = ChatMessageWithSendStatus<GroupMessage>;

const baseMessage = (
  over: Partial<GroupMessageWithSendStatus> = {},
): GroupMessageWithSendStatus => ({
  id: 'm-1',
  clientMessageId: null,
  senderId: 'u-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  content: 'hello',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
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
      result.current.sendMessage({ content: '  hi  ' });
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
        clientMessageId: expect.stringMatching(/^temp-/),
        replyToMessageId: null,
      },
    );
    expect(temp.clientMessageId).toBe(temp.id);
  });

  it('forwards replyTo on the optimistic message and replyToMessageId on the emit', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const replyTo = {
      id: 'parent-msg-1',
      authorId: 'u-other',
      snippet: 'mensagem original',
      isDeleted: false,
    };

    act(() => {
      result.current.sendMessage({ content: 'resposta', replyTo });
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0]?.replyTo).toEqual(replyTo);
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.SEND_MESSAGE,
      expect.objectContaining({
        groupId: 'g-1',
        content: 'resposta',
        replyToMessageId: 'parent-msg-1',
      }),
    );
  });

  it('reconciles the server echo with an optimistic temp via clientMessageId', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage({ content: 'hello world' });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const tempClientId = result.current.messages[0].clientMessageId;
    expect(result.current.messages[0].id.startsWith('temp-')).toBe(true);
    expect(tempClientId).not.toBeNull();

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_MESSAGE,
        baseMessage({
          id: 'server-uuid-1',
          clientMessageId: tempClientId,
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

  it('reconciles two duplicate-content sends to distinct bubbles via clientMessageId', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    attachAckCapture(handle);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage({ content: 'same text' });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const firstClientId = result.current.messages[0].clientMessageId;

    act(() => {
      result.current.sendMessage({ content: 'same text' });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    const secondClientId = result.current.messages[0].clientMessageId;
    expect(firstClientId).not.toBe(secondClientId);

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_MESSAGE,
        baseMessage({
          id: 'server-first',
          clientMessageId: firstClientId,
          senderId: 'me',
          senderName: 'Me',
          content: 'same text',
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'server-first',
        secondClientId,
      ]),
    );

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_MESSAGE,
        baseMessage({
          id: 'server-second',
          clientMessageId: secondClientId,
          senderId: 'me',
          senderName: 'Me',
          content: 'same text',
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'server-second',
        'server-first',
      ]),
    );
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
      result.current.sendMessage({ content: '   ' });
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

  describe('messageStatuses', () => {
    it("marks own temp messages as 'sending' and own confirmed messages as 'sent'", async () => {
      mockedGetHistory.mockResolvedValueOnce({
        data: [
          baseMessage({ id: 'm-mine-old', senderId: 'me', content: 'older' }),
        ],
        next_cursor: null,
      });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.sendMessage({ content: 'newer' });
      });
      await waitFor(() => expect(result.current.messages).toHaveLength(2));

      const tempId = result.current.messages[0].id;
      expect(tempId.startsWith('temp-')).toBe(true);
      expect(result.current.messages[0].sendStatus).toBe('sending');
      expect(result.current.messageStatuses[tempId]).toBe('sending');
      expect(result.current.messageStatuses['m-mine-old']).toBe('sent');
    });

    it("uses a temp message's local sendStatus when present", async () => {
      mockedGetHistory.mockResolvedValueOnce({
        data: [
          baseMessage({
            id: 'temp-error',
            senderId: 'me',
            content: 'will retry later',
            sendStatus: 'error',
          }),
        ],
        next_cursor: null,
      });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.messageStatuses['temp-error']).toBe('error');
    });

    it('omits peer messages from the status map', async () => {
      mockedGetHistory.mockResolvedValueOnce({
        data: [
          baseMessage({ id: 'm-peer', senderId: 'u-other', content: 'hi' }),
          baseMessage({ id: 'm-mine', senderId: 'me', content: 'hey' }),
        ],
        next_cursor: null,
      });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.messageStatuses).toEqual({ 'm-mine': 'sent' });
      expect(result.current.messageStatuses['m-peer']).toBeUndefined();
    });

    it("flips 'sending' to 'sent' when the server echo replaces the temp", async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.sendMessage({ content: 'hello world' });
      });
      await waitFor(() => expect(result.current.messages).toHaveLength(1));
      const tempId = result.current.messages[0].id;
      const tempClientId = result.current.messages[0].clientMessageId;
      expect(result.current.messageStatuses[tempId]).toBe('sending');

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_MESSAGE,
          baseMessage({
            id: 'server-uuid-1',
            clientMessageId: tempClientId,
            senderId: 'me',
            senderName: 'Me',
            content: 'hello world',
          }),
        );
      });

      await waitFor(() =>
        expect(result.current.messageStatuses['server-uuid-1']).toBe('sent'),
      );
      expect(result.current.messageStatuses[tempId]).toBeUndefined();
    });

    it('returns an empty status map when there is no authenticated user', async () => {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isNewUser: false,
      });
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });

      expect(result.current.messageStatuses).toEqual({});
    });
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

  describe('send failure detection (E3)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    type GroupCache = {
      pages: Array<{ data: GroupMessageWithSendStatus[] }>;
    };
    const groupKey = ['chat', 'history', 'g-1'] as const;
    const readCache = (client: QueryClient): GroupCache | undefined =>
      client.getQueryData<GroupCache>(groupKey);
    const firstMessage = (
      client: QueryClient,
    ): GroupMessageWithSendStatus | undefined =>
      readCache(client)?.pages[0]?.data[0];

    it('marks the temp as error after SEND_TIMEOUT_MS without a server echo', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'hello world' });
      });

      const temp = firstMessage(client);
      expect(temp?.sendStatus).toBe('sending');
      expect(temp?.id.startsWith('temp-')).toBe(true);
      const tempId = temp!.id;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });

      const after = firstMessage(client);
      expect(after?.id).toBe(tempId);
      expect(after?.sendStatus).toBe('error');
      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
    });

    it('clears the send timer when the server echo arrives before timeout', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'hi' });
      });
      const tempClientId = firstMessage(client)?.clientMessageId;
      expect(tempClientId).toBeTruthy();

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_MESSAGE,
          baseMessage({
            id: 'server-1',
            clientMessageId: tempClientId,
            senderId: 'me',
            senderName: 'Me',
            content: 'hi',
          }),
        );
      });

      expect(firstMessage(client)?.id).toBe('server-1');

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-1');
      expect(firstMessage(client)?.sendStatus).toBeUndefined();
    });

    it('replaces an errored temp when a late server echo arrives', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'late' });
      });
      const tempClientId = firstMessage(client)?.clientMessageId;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_MESSAGE,
          baseMessage({
            id: 'server-late',
            clientMessageId: tempClientId,
            senderId: 'me',
            senderName: 'Me',
            content: 'late',
          }),
        );
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-late');
    });

    it('does not mutate cache from a fired timer after the hook unmounts', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result, unmount } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'bye' });
      });

      const cacheBefore = readCache(client);
      unmount();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)).toBe(cacheBefore);
    });
  });

  describe('retrySendMessage (E5)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    type GroupCache = {
      pages: Array<{ data: GroupMessageWithSendStatus[] }>;
    };
    const groupKey = ['chat', 'history', 'g-1'] as const;
    const readCache = (client: QueryClient): GroupCache | undefined =>
      client.getQueryData<GroupCache>(groupKey);
    const firstMessage = (
      client: QueryClient,
    ): GroupMessageWithSendStatus | undefined =>
      readCache(client)?.pages[0]?.data[0];

    it("flips an errored temp back to 'sending' and re-emits send_message with the same clientMessageId", async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({
          content: 'hello world',
          replyTo: {
            id: 'parent-1',
            authorId: 'u-other',
            snippet: 'original',
            isDeleted: false,
          },
        });
      });
      const temp = firstMessage(client);
      const tempId = temp!.id;
      const tempClientId = temp!.clientMessageId!;
      expect(tempClientId).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');
      (handle.manager.emit as jest.Mock).mockClear();

      act(() => {
        result.current.retrySendMessage(tempId);
      });

      expect(firstMessage(client)?.id).toBe(tempId);
      expect(firstMessage(client)?.sendStatus).toBe('sending');
      expect(handle.manager.emit).toHaveBeenCalledTimes(1);
      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.SEND_MESSAGE,
        {
          groupId: 'g-1',
          content: 'hello world',
          storageKey: null,
          mediaType: null,
          clientMessageId: tempClientId,
          replyToMessageId: 'parent-1',
        },
      );
    });

    it("re-arms the timeout so a failed retry flips back to 'error'", async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'hi' });
      });
      const tempId = firstMessage(client)!.id;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        result.current.retrySendMessage(tempId);
      });
      expect(firstMessage(client)?.sendStatus).toBe('sending');

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');
    });

    it('lets the server echo replace the retried temp via clientMessageId', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'late' });
      });
      const temp = firstMessage(client)!;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        result.current.retrySendMessage(temp.id);
      });

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_MESSAGE,
          baseMessage({
            id: 'server-late',
            clientMessageId: temp.clientMessageId,
            senderId: 'me',
            senderName: 'Me',
            content: 'late',
          }),
        );
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-late');
    });

    it('is a no-op when the message id is not in the cache', async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage('temp-does-not-exist');
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });

    it('is a no-op when the matched message is not a temp', async () => {
      mockedGetHistory.mockResolvedValueOnce({
        data: [baseMessage({ id: 'm-server', senderId: 'me' })],
        next_cursor: null,
      });
      attachAckCapture(handle);

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage('m-server');
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });

    it("is a no-op when the temp's sendStatus is not 'error'", async () => {
      mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
      attachAckCapture(handle);
      const client = makeClient();

      const { result } = renderHook(() => useGroupChat('g-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'pending' });
      });
      const tempId = firstMessage(client)!.id;
      expect(firstMessage(client)?.sendStatus).toBe('sending');

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage(tempId);
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });
  });
});
