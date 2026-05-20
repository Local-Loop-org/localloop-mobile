import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatSocketEvents } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { dmApi } from '@/infra/api/dm.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import type { ChatMessage } from '@/infra/api/messages.api';
import { useDmChat } from './useDmChat';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    getDmHistory: jest.fn(),
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

const mockedGetDmHistory = dmApi.getDmHistory as jest.MockedFunction<
  typeof dmApi.getDmHistory
>;
const mockedCreateChatSocket = createChatSocket as jest.Mock;

const baseMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'dm-1',
  senderId: 'peer-1',
  senderName: 'Alice',
  senderAvatar: null,
  content: 'ola',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-05-17T10:00:00.000Z',
  ...overrides,
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

describe('useDmChat', () => {
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

  it('loads history, connects the socket, and emits join_dm with userId', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [baseMessage()],
      next_cursor: null,
    });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmChat('peer-1'), {
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

    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.JOIN_DM, {
      userId: 'peer-1',
    });
    expect(mock.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_INBOX,
      {},
    );
    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.MARK_DM_READ, {
      peerId: 'peer-1',
    });
    expect(result.current.connected).toBe(true);
  });

  it('sendMessage optimistically prepends a temp DM and emits send_dm', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.sendMessage('  oi  ');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0]).toMatchObject({
      senderId: 'me',
      content: 'oi',
    });
    expect(result.current.messages[0]?.id.startsWith('temp-')).toBe(true);
    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.SEND_DM, {
      recipientId: 'peer-1',
      content: 'oi',
      mediaUrl: null,
      mediaType: null,
    });
  });

  it('emits leave_dm with userId and disconnects on unmount', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result, unmount } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.LEAVE_DM, {
      userId: 'peer-1',
    });
    expect(mock.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_INBOX,
      {},
    );
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('marks the DM read after incoming peer messages', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire(ChatSocketEvents.NEW_DIRECT_MESSAGE, baseMessage({ id: 'dm-2' }));
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(mock.emit).toHaveBeenCalledWith(ChatSocketEvents.MARK_DM_READ, {
      peerId: 'peer-1',
    });
  });

  it('handles dm_request_sent by removing temp messages and waiting for approval', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.sendMessage('oi');
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => {
      fire(ChatSocketEvents.DM_REQUEST_SENT, { requestId: 'req-1' });
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(0));
    expect(result.current.awaitingApproval).toBe(true);
  });

  it('handles dm_request_accepted by materializing the message and clearing approval', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.sendMessage('oi');
    });
    act(() => {
      fire(ChatSocketEvents.DM_REQUEST_SENT, { requestId: 'req-1' });
    });
    await waitFor(() => expect(result.current.awaitingApproval).toBe(true));

    act(() => {
      fire(ChatSocketEvents.DM_REQUEST_ACCEPTED, {
        id: 'dm-accepted',
        senderId: 'me',
        senderName: 'Me',
        senderAvatar: null,
        recipientId: 'peer-1',
        content: 'oi',
        mediaUrl: null,
        mediaType: null,
        createdAt: '2026-05-17T10:00:00.000Z',
      });
    });

    await waitFor(() =>
      expect(result.current.messages[0]).toMatchObject({
        id: 'dm-accepted',
        senderId: 'me',
        content: 'oi',
      }),
    );
    expect(result.current.awaitingApproval).toBe(false);
  });
});
