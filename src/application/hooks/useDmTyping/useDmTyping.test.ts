import { act, renderHook } from '@testing-library/react-native';
import { ChatSocketEvents } from '@localloop/shared-types';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import { useDmTyping } from './useDmTyping';

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

const typingStartCalls = (handle: ManagerMockHandle) =>
  (handle.manager.emit as jest.Mock).mock.calls.filter(
    ([event, payload]) =>
      event === ChatSocketEvents.DM_TYPING &&
      (payload as { isTyping: boolean }).isTyping === true,
  );

describe('useDmTyping', () => {
  let handle: ManagerMockHandle;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    handle = makeManagerMock();
    handle.setConnected(true);
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('receiving the peer state', () => {
    it('reflects the peer typing state from matching updates', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));
      expect(result.current.peerTyping).toBe(false);

      act(() => {
        handle.fire(ChatSocketEvents.DM_TYPING_UPDATE, {
          peerId: 'peer-1',
          isTyping: true,
        });
      });
      expect(result.current.peerTyping).toBe(true);

      act(() => {
        handle.fire(ChatSocketEvents.DM_TYPING_UPDATE, {
          peerId: 'peer-1',
          isTyping: false,
        });
      });
      expect(result.current.peerTyping).toBe(false);
    });

    it('ignores typing updates for other peers', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));

      act(() => {
        handle.fire(ChatSocketEvents.DM_TYPING_UPDATE, {
          peerId: 'peer-2',
          isTyping: true,
        });
      });

      expect(result.current.peerTyping).toBe(false);
    });

    it('auto-clears the typing state if no refresh arrives', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));

      act(() => {
        handle.fire(ChatSocketEvents.DM_TYPING_UPDATE, {
          peerId: 'peer-1',
          isTyping: true,
        });
      });
      expect(result.current.peerTyping).toBe(true);

      act(() => {
        jest.advanceTimersByTime(6000);
      });
      expect(result.current.peerTyping).toBe(false);
    });
  });

  describe('sending our own state', () => {
    it('emits a typing-start on the first keystroke', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));

      act(() => {
        result.current.notifyTyping();
      });

      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.DM_TYPING,
        { recipientId: 'peer-1', isTyping: true },
      );
    });

    it('throttles repeated keystrokes into a single typing-start', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));

      act(() => {
        result.current.notifyTyping();
        result.current.notifyTyping();
        result.current.notifyTyping();
      });

      expect(typingStartCalls(handle)).toHaveLength(1);
    });

    it('emits a stop after the idle timeout', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));
      act(() => {
        result.current.notifyTyping();
      });
      (handle.manager.emit as jest.Mock).mockClear();

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.DM_TYPING,
        { recipientId: 'peer-1', isTyping: false },
      );
    });

    it('emits a stop immediately on notifyStopTyping when typing was active', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));
      act(() => {
        result.current.notifyTyping();
      });
      (handle.manager.emit as jest.Mock).mockClear();

      act(() => {
        result.current.notifyStopTyping();
      });

      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.DM_TYPING,
        { recipientId: 'peer-1', isTyping: false },
      );
    });

    it('does not emit a stop when the user was not typing', () => {
      const { result } = renderHook(() => useDmTyping('peer-1'));

      act(() => {
        result.current.notifyStopTyping();
      });

      expect(handle.manager.emit).not.toHaveBeenCalled();
    });

    it('emits a stop on unmount when typing was active', () => {
      const { result, unmount } = renderHook(() => useDmTyping('peer-1'));
      act(() => {
        result.current.notifyTyping();
      });
      (handle.manager.emit as jest.Mock).mockClear();

      act(() => {
        unmount();
      });

      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.DM_TYPING,
        { recipientId: 'peer-1', isTyping: false },
      );
    });

    it('does not emit for an empty peerId', () => {
      const { result } = renderHook(() => useDmTyping(''));

      act(() => {
        result.current.notifyTyping();
      });

      expect(handle.manager.emit).not.toHaveBeenCalled();
    });
  });
});
