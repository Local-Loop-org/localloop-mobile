import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/application/stores/auth.store';
import { messagesApi, ChatMessage } from '@/infra/api/messages.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { useGroupChat } from './useGroupChat';

jest.mock('@/infra/api/messages.api', () => ({
  messagesApi: {
    getHistory: jest.fn(),
  },
}));

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
      const h = handlers.get(event);
      if (h) h(payload);
    },
  };
}

const mockedGetHistory = messagesApi.getHistory as jest.Mock;
const mockedCreateChatSocket = createChatSocket as jest.Mock;

const baseMessage = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  senderId: 'u-1',
  senderName: 'Alice',
  senderAvatar: null,
  content: 'hello',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  ...over,
});

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('useGroupChat', () => {
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

  it('loads history, connects the socket, and emits join_group on connect', async () => {
    mockedGetHistory.mockResolvedValueOnce({
      data: [baseMessage()],
      next_cursor: null,
    });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(1);
    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );

    act(() => {
      fire('connect');
    });

    expect(mock.emit).toHaveBeenCalledWith('join_group', { groupId: 'g-1' });
    expect(result.current.connected).toBe(true);
  });

  it('appends new_message events to the front of the list and dedupes by id', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    const incoming = baseMessage({ id: 'm-2', content: 'first' });
    act(() => {
      fire('new_message', incoming);
    });
    await waitFor(() =>
      expect(result.current.messages[0]?.id).toBe('m-2'),
    );

    const second = baseMessage({ id: 'm-3', content: 'second' });
    act(() => {
      fire('new_message', second);
    });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'm-3',
        'm-2',
      ]),
    );

    act(() => {
      fire('new_message', second);
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('sendMessage optimistically prepends a temp-* message and emits send_message', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.sendMessage('  hi  ');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const temp = result.current.messages[0];
    expect(temp.id.startsWith('temp-')).toBe(true);
    expect(temp.content).toBe('hi');
    expect(temp.senderId).toBe('me');

    expect(mock.emit).toHaveBeenCalledWith('send_message', {
      groupId: 'g-1',
      content: 'hi',
      storageKey: null,
      mediaType: null,
    });
  });

  it('reconciles the server echo with an optimistic temp (same senderId + content)', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.sendMessage('hello world');
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].id.startsWith('temp-')).toBe(true);

    act(() => {
      fire(
        'new_message',
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
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

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
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    mock.emit.mockClear();
    act(() => {
      result.current.sendMessage('   ');
    });
    expect(mock.emit).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it('emits leave_group and disconnects on unmount', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result, unmount } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith('leave_group', { groupId: 'g-1' });
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('sets error=load_failed when initial history fetch throws', async () => {
    mockedGetHistory.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('load_failed');
    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });

  it('starts onlineCount at 0 and updates on presence_update events for the same group', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    expect(result.current.onlineCount).toBe(0);

    act(() => {
      fire('presence_update', { groupId: 'g-1', count: 3 });
    });
    await waitFor(() => expect(result.current.onlineCount).toBe(3));

    act(() => {
      fire('presence_update', { groupId: 'g-1', count: 5 });
    });
    await waitFor(() => expect(result.current.onlineCount).toBe(5));
  });

  it('ignores presence_update events for other groups', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire('presence_update', { groupId: 'g-OTHER', count: 99 });
    });

    expect(result.current.onlineCount).toBe(0);
  });
});
