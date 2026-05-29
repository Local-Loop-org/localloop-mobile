import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ChatSocketEvents,
  type DirectMessage,
  type DirectMessageHistoryResponse,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { dmApi } from '@/infra/api/dm.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
import {
  makeManagerMock,
  type ManagerMockHandle,
} from '@/infra/socket/test-utils';
import { useDmReadState } from './useDmReadState';

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
  clientMessageId: null,
  senderId: 'me',
  senderName: 'Me',
  senderAvatarUrl: null,
  recipientId: 'peer-1',
  content: 'ola',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-05-27T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
  ...overrides,
});

function historyResponse(
  overrides: Partial<DirectMessageHistoryResponse> = {},
): DirectMessageHistoryResponse {
  return {
    data: [],
    lastReadAt: null,
    peerLastReadAt: null,
    next_cursor: null,
    ...overrides,
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function makeWrapper(client = makeClient()) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('useDmReadState', () => {
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
    mockedUseChatSocketManager.mockReturnValue(handle.manager);
  });

  it('derives read and sent statuses from the seeded peer watermark', async () => {
    mockedGetDmHistory.mockResolvedValueOnce(
      historyResponse({
        lastReadAt: '2026-05-27T10:06:00.000Z',
        peerLastReadAt: '2026-05-27T10:02:00.000Z',
        data: [
          baseMessage({
            id: 'own-read',
            createdAt: '2026-05-27T10:00:00.000Z',
          }),
          baseMessage({
            id: 'own-sent',
            createdAt: '2026-05-27T10:05:00.000Z',
          }),
          baseMessage({
            id: 'peer-message',
            senderId: 'peer-1',
            senderName: 'Alice',
            recipientId: 'me',
            createdAt: '2026-05-27T10:07:00.000Z',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useDmReadState('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['own-read']).toBe('read'),
    );

    expect(result.current.lastReadAt).toBe('2026-05-27T10:06:00.000Z');
    expect(result.current.peerLastReadAt).toBe('2026-05-27T10:02:00.000Z');
    expect(result.current.messageStatuses['own-sent']).toBe('sent');
    expect(result.current.messageStatuses['peer-message']).toBeUndefined();
  });

  it('keeps optimistic temp messages in sending state', async () => {
    mockedGetDmHistory.mockResolvedValueOnce(
      historyResponse({
        peerLastReadAt: '2026-05-27T10:10:00.000Z',
        data: [
          baseMessage({
            id: 'temp-1',
            createdAt: '2026-05-27T10:00:00.000Z',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useDmReadState('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['temp-1']).toBe('sending'),
    );
  });

  it('advances peerLastReadAt from fresh read receipts', async () => {
    mockedGetDmHistory.mockResolvedValueOnce(
      historyResponse({
        peerLastReadAt: '2026-05-27T10:01:00.000Z',
        data: [
          baseMessage({
            id: 'own-message',
            createdAt: '2026-05-27T10:05:00.000Z',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useDmReadState('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['own-message']).toBe('sent'),
    );

    act(() => {
      handle.fire(ChatSocketEvents.DM_READ_RECEIPT, {
        readerId: 'peer-1',
        peerId: 'me',
        lastReadAt: '2026-05-27T10:06:00.000Z',
      });
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['own-message']).toBe('read'),
    );
    expect(result.current.peerLastReadAt).toBe('2026-05-27T10:06:00.000Z');
  });

  it('ignores stale peer read receipts', async () => {
    mockedGetDmHistory.mockResolvedValueOnce(
      historyResponse({
        peerLastReadAt: '2026-05-27T10:06:00.000Z',
        data: [
          baseMessage({
            id: 'own-message',
            createdAt: '2026-05-27T10:05:00.000Z',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useDmReadState('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['own-message']).toBe('read'),
    );

    act(() => {
      handle.fire(ChatSocketEvents.DM_READ_RECEIPT, {
        readerId: 'peer-1',
        peerId: 'me',
        lastReadAt: '2026-05-27T10:01:00.000Z',
      });
    });

    expect(result.current.peerLastReadAt).toBe('2026-05-27T10:06:00.000Z');
    expect(result.current.messageStatuses['own-message']).toBe('read');
  });

  it('ignores receipts for unrelated peers', async () => {
    mockedGetDmHistory.mockResolvedValueOnce(
      historyResponse({
        data: [
          baseMessage({
            id: 'own-message',
            createdAt: '2026-05-27T10:05:00.000Z',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useDmReadState('peer-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.messageStatuses['own-message']).toBe('sent'),
    );

    act(() => {
      handle.fire(ChatSocketEvents.DM_READ_RECEIPT, {
        readerId: 'peer-2',
        peerId: 'me',
        lastReadAt: '2026-05-27T10:10:00.000Z',
      });
    });

    expect(result.current.peerLastReadAt).toBeNull();
    expect(result.current.messageStatuses['own-message']).toBe('sent');
  });
});
