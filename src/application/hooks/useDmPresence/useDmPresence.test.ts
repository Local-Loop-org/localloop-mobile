import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ChatSocketEvents } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { useDmPresence } from './useDmPresence';

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

describe('useDmPresence', () => {
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

  it('watches DM presence on socket connect', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    renderHook(() => useDmPresence('peer-1'));

    await waitFor(() =>
      expect(mockedCreateChatSocket).toHaveBeenCalledWith('tok'),
    );

    act(() => {
      fire('connect');
    });

    expect(mock.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_PRESENCE,
      { peerId: 'peer-1' },
    );
  });

  it('returns online status from matching presence updates', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmPresence('peer-1'));

    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());
    expect(result.current).toBeNull();

    act(() => {
      fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-1',
        online: true,
      });
    });

    await waitFor(() => expect(result.current).toEqual({ kind: 'online' }));

    act(() => {
      fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-1',
        online: false,
      });
    });

    await waitFor(() => expect(result.current).toBeNull());
  });

  it('ignores presence updates for other peers', async () => {
    const { mock, fire } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { result } = renderHook(() => useDmPresence('peer-1'));

    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    act(() => {
      fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-2',
        online: true,
      });
    });

    expect(result.current).toBeNull();
  });

  it('unwatches and disconnects on cleanup', async () => {
    const { mock } = makeSocketMock();
    mockedCreateChatSocket.mockReturnValueOnce(mock);

    const { unmount } = renderHook(() => useDmPresence('peer-1'));

    await waitFor(() => expect(mockedCreateChatSocket).toHaveBeenCalled());

    unmount();

    expect(mock.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_PRESENCE,
      { peerId: 'peer-1' },
    );
    expect(mock.removeAllListeners).toHaveBeenCalled();
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('does not create a socket without an access token', () => {
    useAuthStore.setState({ accessToken: null } as never);

    renderHook(() => useDmPresence('peer-1'));

    expect(mockedCreateChatSocket).not.toHaveBeenCalled();
  });
});
