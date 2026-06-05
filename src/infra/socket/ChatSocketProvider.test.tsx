import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from './chat-socket';
import {
  ChatSocketProvider,
  useChatSocketManager,
} from './ChatSocketProvider';

jest.mock('./chat-socket', () => ({
  createChatSocket: jest.fn(),
}));

type SocketHandler = (...args: unknown[]) => void;

interface SocketMock {
  emit: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
  disconnect: jest.Mock;
  removeAllListeners: jest.Mock;
  timeout: jest.Mock;
  connected: boolean;
  fire: (event: string, payload?: unknown) => void;
}

function makeSocketMock(): SocketMock {
  const handlers = new Map<string, Set<SocketHandler>>();
  const socket: SocketMock = {
    connected: false,
    emit: jest.fn(),
    on: jest.fn((event: string, handler: SocketHandler) => {
      let bag = handlers.get(event);
      if (!bag) {
        bag = new Set();
        handlers.set(event, bag);
      }
      bag.add(handler);
    }),
    off: jest.fn((event: string, handler: SocketHandler) => {
      handlers.get(event)?.delete(handler);
    }),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    timeout: jest.fn(),
    fire: (event, payload) => {
      const bag = handlers.get(event);
      if (!bag) return;
      for (const h of [...bag]) h(payload);
    },
  };
  socket.timeout.mockImplementation(() => ({
    emit: (event: string, payload: unknown, cb?: SocketHandler) => {
      socket.emit(event, payload, cb);
    },
  }));
  return socket;
}

const mockedCreateChatSocket = createChatSocket as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  return <ChatSocketProvider>{children}</ChatSocketProvider>;
}

describe('ChatSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'me', displayName: 'Me', avatarUrl: null } as never,
      accessToken: 'tok',
      refreshToken: 'ref',
      isAuthenticated: true,
      isNewUser: false,
    });
  });

  it('creates exactly one socket when authenticated', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    renderHook(() => useChatSocketManager(), { wrapper });

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );
    expect(mockedCreateChatSocket).toHaveBeenCalledTimes(1);
  });

  it('does not create a socket without an access token', () => {
    useAuthStore.setState({ accessToken: null } as never);

    renderHook(() => useChatSocketManager(), { wrapper });

    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });

  it('disconnects and clears subscriptions when the token becomes null', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result, rerender } = renderHook(() => useChatSocketManager(), {
      wrapper,
    });

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );

    const subscribeCb = jest.fn();
    const unsubscribeCb = jest.fn();
    act(() => {
      result.current.subscribe({
        key: 'group:join:g-1',
        subscribe: subscribeCb,
        unsubscribe: unsubscribeCb,
      });
    });

    socket.connected = true;
    act(() => {
      socket.fire('connect');
    });
    expect(subscribeCb).toHaveBeenCalledTimes(1);

    act(() => {
      useAuthStore.setState({ accessToken: null } as never);
    });
    rerender(undefined);

    expect(socket.disconnect).toHaveBeenCalled();

    // Re-login should result in a fresh socket with no replayed subscriptions
    const socket2 = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket2);
    act(() => {
      useAuthStore.setState({ accessToken: 'tok2' } as never);
    });
    rerender(undefined);
    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenLastCalledWith('tok2'),
    );

    socket2.connected = true;
    act(() => {
      socket2.fire('connect');
    });
    expect(subscribeCb).toHaveBeenCalledTimes(1);
  });

  it('does not create a second socket when multiple hooks subscribe', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result } = renderHook(
      () => {
        const a = useChatSocketManager();
        const b = useChatSocketManager();
        return { a, b };
      },
      { wrapper },
    );

    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    expect(mockedCreateChatSocket).toHaveBeenCalledTimes(1);
    expect(result.current.a).toBe(result.current.b);
  });

  it('ref-counts duplicate subscriptions and emits subscribe/unsubscribe only on edges', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result } = renderHook(() => useChatSocketManager(), { wrapper });

    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    socket.connected = true;
    act(() => {
      socket.fire('connect');
    });

    const subscribeCb = jest.fn();
    const unsubscribeCb = jest.fn();

    let off1: () => void = () => undefined;
    let off2: () => void = () => undefined;
    act(() => {
      off1 = result.current.subscribe({
        key: 'dm:join:peer-1',
        subscribe: subscribeCb,
        unsubscribe: unsubscribeCb,
      });
    });
    expect(subscribeCb).toHaveBeenCalledTimes(1);

    act(() => {
      off2 = result.current.subscribe({
        key: 'dm:join:peer-1',
        subscribe: subscribeCb,
        unsubscribe: unsubscribeCb,
      });
    });
    // Already subscribed: second subscribe must NOT emit again.
    expect(subscribeCb).toHaveBeenCalledTimes(1);

    act(() => {
      off1();
    });
    expect(unsubscribeCb).not.toHaveBeenCalled();

    act(() => {
      off2();
    });
    expect(unsubscribeCb).toHaveBeenCalledTimes(1);
  });

  it('replays active subscriptions on reconnect', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result } = renderHook(() => useChatSocketManager(), { wrapper });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    const subscribeCb = jest.fn();
    const unsubscribeCb = jest.fn();
    act(() => {
      result.current.subscribe({
        key: 'group:join:g-1',
        subscribe: subscribeCb,
        unsubscribe: unsubscribeCb,
      });
    });
    // Pre-connect: subscribe() must not fire yet.
    expect(subscribeCb).not.toHaveBeenCalled();

    socket.connected = true;
    act(() => {
      socket.fire('connect');
    });
    expect(subscribeCb).toHaveBeenCalledTimes(1);

    // Simulate a network blip: socket disconnects then reconnects.
    socket.connected = false;
    act(() => {
      socket.fire('disconnect');
    });
    socket.connected = true;
    act(() => {
      socket.fire('connect');
    });
    expect(subscribeCb).toHaveBeenCalledTimes(2);
  });

  it('addListener removes only the listener it registered', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result } = renderHook(() => useChatSocketManager(), { wrapper });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    const handlerA = jest.fn();
    const handlerB = jest.fn();
    let offA: () => void = () => undefined;
    act(() => {
      offA = result.current.addListener('some_event', handlerA);
      result.current.addListener('some_event', handlerB);
    });

    act(() => {
      socket.fire('some_event', { hello: 'world' });
    });
    expect(handlerA).toHaveBeenCalledWith({ hello: 'world' });
    expect(handlerB).toHaveBeenCalledWith({ hello: 'world' });

    act(() => {
      offA();
    });
    act(() => {
      socket.fire('some_event', { again: true });
    });
    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(2);
  });

  it('emit and emitWithAck pass through to the live socket', async () => {
    const socket = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(socket);

    const { result } = renderHook(() => useChatSocketManager(), { wrapper });
    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      result.current.emit('send_message', { groupId: 'g-1' });
    });
    expect(socket.emit).toHaveBeenCalledWith('send_message', {
      groupId: 'g-1',
    });

    const cb = jest.fn();
    act(() => {
      result.current.emitWithAck(
        'mark_group_read',
        { groupId: 'g-1' },
        4_000,
        cb,
      );
    });
    expect(socket.timeout).toHaveBeenCalledWith(4_000);
    expect(socket.emit).toHaveBeenCalledWith(
      'mark_group_read',
      { groupId: 'g-1' },
      cb,
    );
  });

  // Regression: a stale @localloop/shared-types made ChatSocketEvents.DM_TYPING
  // `undefined`, so emit(undefined, …) serialized as `[null, …]` and the server
  // closed the socket. The guard must refuse such emits instead of passing them
  // through.
  describe('emit guard against invalid event names', () => {
    const devFlag = global as unknown as { __DEV__: boolean };

    it('throws in dev and never touches the socket when the event name is undefined', async () => {
      const socket = makeSocketMock();
      mockedCreateChatSocket.mockReturnValueOnce(socket);
      const { result } = renderHook(() => useChatSocketManager(), { wrapper });
      await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

      expect(() =>
        result.current.emit(undefined as unknown as string, {
          recipientId: 'peer',
        }),
      ).toThrow(/invalid event name/);
      expect(socket.emit).not.toHaveBeenCalled();
    });

    it('emitWithAck throws in dev for an empty event name and never calls timeout', async () => {
      const socket = makeSocketMock();
      mockedCreateChatSocket.mockReturnValueOnce(socket);
      const { result } = renderHook(() => useChatSocketManager(), { wrapper });
      await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

      const cb = jest.fn();
      expect(() => result.current.emitWithAck('', {}, 4_000, cb)).toThrow(
        /invalid event name/,
      );
      expect(socket.timeout).not.toHaveBeenCalled();
      expect(cb).not.toHaveBeenCalled();
    });

    it('in production logs and drops the frame instead of emitting', async () => {
      const socket = makeSocketMock();
      mockedCreateChatSocket.mockReturnValueOnce(socket);
      const { result } = renderHook(() => useChatSocketManager(), { wrapper });
      await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

      const prevDev = devFlag.__DEV__;
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      try {
        devFlag.__DEV__ = false;
        result.current.emit(undefined as unknown as string, { x: 1 });
        const cb = jest.fn();
        result.current.emitWithAck(
          undefined as unknown as string,
          {},
          4_000,
          cb,
        );

        expect(socket.emit).not.toHaveBeenCalled();
        expect(socket.timeout).not.toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
        expect(errorSpy).toHaveBeenCalled();
      } finally {
        devFlag.__DEV__ = prevDev;
        errorSpy.mockRestore();
      }
    });
  });
});
