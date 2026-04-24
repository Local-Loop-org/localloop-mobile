import { act, renderHook, waitFor } from '@testing-library/react-native';
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

describe('useGroupChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'me', displayName: 'Me' } as never,
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

    const { result } = renderHook(() => useGroupChat('g-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(1);
    expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok');

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

    const { result } = renderHook(() => useGroupChat('g-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const incoming = baseMessage({ id: 'm-2', content: 'first' });
    act(() => {
      fire('new_message', incoming);
    });
    expect(result.current.messages[0].id).toBe('m-2');

    const second = baseMessage({ id: 'm-3', content: 'second' });
    act(() => {
      fire('new_message', second);
    });
    expect(result.current.messages.map((m) => m.id)).toEqual(['m-3', 'm-2']);

    // Dedupe: re-emitting the same id is a no-op.
    act(() => {
      fire('new_message', second);
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('sendMessage emits send_message with trimmed content', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('  hi  ');
    });

    expect(mock.emit).toHaveBeenCalledWith('send_message', {
      groupId: 'g-1',
      content: 'hi',
      storageKey: null,
      mediaType: null,
    });
  });

  it('sendMessage is a no-op for empty or whitespace-only input', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useGroupChat('g-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mock.emit.mockClear();
    act(() => {
      result.current.sendMessage('   ');
    });
    expect(mock.emit).not.toHaveBeenCalled();
  });

  it('emits leave_group and disconnects on unmount', async () => {
    mockedGetHistory.mockResolvedValueOnce({ data: [], next_cursor: null });
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result, unmount } = renderHook(() => useGroupChat('g-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();

    expect(mock.emit).toHaveBeenCalledWith('leave_group', { groupId: 'g-1' });
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('sets error=load_failed when initial history fetch throws', async () => {
    mockedGetHistory.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useGroupChat('g-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('load_failed');
    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });
});
