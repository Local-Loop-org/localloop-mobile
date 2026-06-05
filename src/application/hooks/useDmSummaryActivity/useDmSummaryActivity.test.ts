import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ChatSocketEvents } from '@localloop/shared-types';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { useDmSummaryActivity } from './useDmSummaryActivity';

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

describe('useDmSummaryActivity', () => {
  let handle: ManagerMockHandle;

  beforeEach(() => {
    jest.clearAllMocks();
    handle = makeManagerMock();
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  it('subscribes to the DM inbox on mount and unsubscribes on cleanup', () => {
    handle.setConnected(true);
    const { unmount } = renderHook(() => useDmSummaryActivity('peer-1'));

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_INBOX,
      {},
    );

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_INBOX,
      {},
    );
  });

  it('returns lastActivityAt from matching summary updates', async () => {
    handle.setConnected(true);
    const { result } = renderHook(() => useDmSummaryActivity('peer-1'));

    expect(result.current).toBeNull();

    act(() => {
      handle.fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
        peerId: 'peer-1',
        lastActivityAt: '2026-06-05T04:02:06.222Z',
        lastReadAt: '2026-06-05T17:36:08.521Z',
        unreadCount: 0,
        archived: false,
        lastMessage: {
          content: 'Opa',
          senderName: 'Tim Maia',
          createdAt: '2026-06-05T04:02:06.222Z',
        },
      });
    });

    await waitFor(() =>
      expect(result.current).toBe('2026-06-05T04:02:06.222Z'),
    );
  });

  it('ignores summary updates for other peers', () => {
    handle.setConnected(true);
    const { result } = renderHook(() => useDmSummaryActivity('peer-1'));

    act(() => {
      handle.fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
        peerId: 'peer-2',
        lastActivityAt: '2026-06-05T04:02:06.222Z',
        lastReadAt: null,
        unreadCount: 0,
        archived: false,
        lastMessage: null,
      });
    });

    expect(result.current).toBeNull();
  });

  it('keeps the freshest summary timestamp', async () => {
    handle.setConnected(true);
    const { result } = renderHook(() => useDmSummaryActivity('peer-1'));

    act(() => {
      handle.fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
        peerId: 'peer-1',
        lastActivityAt: '2026-06-05T04:02:06.222Z',
        lastReadAt: null,
        unreadCount: 0,
        archived: false,
        lastMessage: null,
      });
    });
    await waitFor(() =>
      expect(result.current).toBe('2026-06-05T04:02:06.222Z'),
    );

    act(() => {
      handle.fire(ChatSocketEvents.DM_SUMMARY_UPDATE, {
        peerId: 'peer-1',
        lastActivityAt: '2026-06-05T03:00:00.000Z',
        lastReadAt: null,
        unreadCount: 0,
        archived: false,
        lastMessage: null,
      });
    });

    expect(result.current).toBe('2026-06-05T04:02:06.222Z');
  });

  it('no-ops when peerId is empty', () => {
    handle.setConnected(true);
    renderHook(() => useDmSummaryActivity(''));

    expect(handle.manager.subscribe).not.toHaveBeenCalled();
    expect(handle.manager.emit).not.toHaveBeenCalled();
  });
});
