import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ChatSocketEvents } from '@localloop/shared-types';
import { makeManagerMock, type ManagerMockHandle } from '@/infra/socket/test-utils';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { useDmPresence } from './useDmPresence';

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

describe('useDmPresence', () => {
  let handle: ManagerMockHandle;

  beforeEach(() => {
    jest.clearAllMocks();
    handle = makeManagerMock();
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  it('subscribes to DM presence on mount and unsubscribes on cleanup', () => {
    handle.setConnected(true);
    const { unmount } = renderHook(() => useDmPresence('peer-1'));

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_PRESENCE,
      { peerId: 'peer-1' },
    );

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_PRESENCE,
      { peerId: 'peer-1' },
    );
  });

  it('returns online status from matching presence updates', async () => {
    handle.setConnected(true);
    const { result } = renderHook(() => useDmPresence('peer-1'));

    expect(result.current).toBeNull();

    act(() => {
      handle.fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-1',
        online: true,
      });
    });
    await waitFor(() => expect(result.current).toEqual({ kind: 'online' }));

    act(() => {
      handle.fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-1',
        online: false,
      });
    });
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('ignores presence updates for other peers', () => {
    handle.setConnected(true);
    const { result } = renderHook(() => useDmPresence('peer-1'));

    act(() => {
      handle.fire(ChatSocketEvents.DM_PRESENCE_UPDATE, {
        peerId: 'peer-2',
        online: true,
      });
    });

    expect(result.current).toBeNull();
  });

  it('defers the subscribe emit until the manager is connected', () => {
    handle.setConnected(false);
    renderHook(() => useDmPresence('peer-1'));

    expect(handle.manager.emit).not.toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_PRESENCE,
      expect.anything(),
    );

    act(() => {
      handle.setConnected(true);
    });

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_PRESENCE,
      { peerId: 'peer-1' },
    );
  });

  it('no-ops when peerId is empty', () => {
    handle.setConnected(true);
    renderHook(() => useDmPresence(''));

    expect(handle.manager.subscribe).not.toHaveBeenCalled();
    expect(handle.manager.emit).not.toHaveBeenCalled();
  });
});
