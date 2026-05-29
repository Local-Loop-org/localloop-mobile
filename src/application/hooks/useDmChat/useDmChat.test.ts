import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatSocketEvents, type DirectMessage } from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { dmApi } from '@/infra/api/dm.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { useDmChat } from './useDmChat';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: {
    getDmHistory: jest.fn(),
  },
}));

jest.mock('@/infra/socket/ChatSocketProvider', () => ({
  useChatSocketManager: jest.fn(),
}));

const mockedGetDmHistory = dmApi.getDmHistory as jest.MockedFunction<
  typeof dmApi.getDmHistory
>;
const mockedUseChatSocketManager = useChatSocketManager as jest.Mock;

const baseMessage = (
  overrides: Partial<DirectMessage> = {},
): DirectMessage => ({
  id: 'dm-1',
  senderId: 'peer-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  recipientId: 'me',
  content: 'ola',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-05-17T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
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

  it('loads history, joins the DM room, watches the inbox, and marks read', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [baseMessage()],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(1);

    expect(handle.manager.emit).toHaveBeenCalledWith(ChatSocketEvents.JOIN_DM, {
      userId: 'peer-1',
    });
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.WATCH_DM_INBOX,
      {},
    );
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.MARK_DM_READ,
      { peerId: 'peer-1' },
    );
    expect(result.current.connected).toBe(true);
  });

  it('sendMessage optimistically prepends a temp DM and emits send_dm', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('  oi  ');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0]).toMatchObject({
      senderId: 'me',
      content: 'oi',
    });
    expect(result.current.messages[0]?.id.startsWith('temp-')).toBe(true);
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.SEND_DM,
      {
        recipientId: 'peer-1',
        content: 'oi',
        mediaUrl: null,
        mediaType: null,
      },
    );
  });

  it('emits leave_dm and unwatch_dm_inbox on unmount', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result, unmount } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();

    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.LEAVE_DM,
      { userId: 'peer-1' },
    );
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.UNWATCH_DM_INBOX,
      {},
    );
  });

  it('marks the DM read after incoming peer messages', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Clear the initial mark-read emitted by the join subscribe callback.
    (handle.manager.emit as jest.Mock).mockClear();

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_DIRECT_MESSAGE,
        baseMessage({ id: 'dm-2' }),
      );
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.MARK_DM_READ,
      { peerId: 'peer-1' },
    );
  });

  it('handles dm_request_sent by removing temp messages and waiting for approval', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('oi');
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => {
      handle.fire(ChatSocketEvents.DM_REQUEST_SENT, { requestId: 'req-1' });
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(0));
    expect(result.current.awaitingApproval).toBe(true);
  });

  it('handles dm_request_accepted by materializing the message and clearing approval', async () => {
    mockedGetDmHistory.mockResolvedValueOnce({
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    });

    const { result } = renderHook(() => useDmChat('peer-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.sendMessage('oi');
    });
    act(() => {
      handle.fire(ChatSocketEvents.DM_REQUEST_SENT, { requestId: 'req-1' });
    });
    await waitFor(() => expect(result.current.awaitingApproval).toBe(true));

    act(() => {
      handle.fire(ChatSocketEvents.DM_REQUEST_ACCEPTED, {
        id: 'dm-accepted',
        senderId: 'me',
        senderName: 'Me',
        senderAvatarUrl: null,
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
