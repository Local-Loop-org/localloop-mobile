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
  clientMessageId: null,
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
      result.current.sendMessage({ content: '  oi  ' });
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
        clientMessageId: expect.stringMatching(/^temp-/),
        replyToMessageId: null,
      },
    );
    expect(result.current.messages[0]?.clientMessageId).toBe(
      result.current.messages[0]?.id,
    );
  });

  it('forwards replyTo on the optimistic message and replyToMessageId on the emit', async () => {
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

    const replyTo = {
      id: 'parent-msg-1',
      authorId: 'peer-1',
      snippet: 'mensagem original',
      isDeleted: false,
    };

    act(() => {
      result.current.sendMessage({ content: 'minha resposta', replyTo });
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0]?.replyTo).toEqual(replyTo);
    expect(handle.manager.emit).toHaveBeenCalledWith(
      ChatSocketEvents.SEND_DM,
      expect.objectContaining({
        recipientId: 'peer-1',
        content: 'minha resposta',
        replyToMessageId: 'parent-msg-1',
      }),
    );
  });

  it('reconciles two duplicate-content DM sends to distinct bubbles via clientMessageId', async () => {
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
      result.current.sendMessage({ content: 'same text' });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const firstClientId = result.current.messages[0].clientMessageId;

    act(() => {
      result.current.sendMessage({ content: 'same text' });
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    const secondClientId = result.current.messages[0].clientMessageId;
    expect(firstClientId).not.toBe(secondClientId);

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_DIRECT_MESSAGE,
        baseMessage({
          id: 'server-first',
          clientMessageId: firstClientId,
          senderId: 'me',
          recipientId: 'peer-1',
          content: 'same text',
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'server-first',
        secondClientId,
      ]),
    );

    act(() => {
      handle.fire(
        ChatSocketEvents.NEW_DIRECT_MESSAGE,
        baseMessage({
          id: 'server-second',
          clientMessageId: secondClientId,
          senderId: 'me',
          recipientId: 'peer-1',
          content: 'same text',
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        'server-second',
        'server-first',
      ]),
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
      result.current.sendMessage({ content: 'oi' });
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
      result.current.sendMessage({ content: 'oi' });
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

  describe('send failure detection (E3)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    type DmMessageWithSendStatus = DirectMessage & {
      sendStatus?: 'sending' | 'sent' | 'error';
    };
    type DmCache = { pages: Array<{ data: DmMessageWithSendStatus[] }> };
    const dmKey = ['dm', 'history', 'peer-1'] as const;
    const readCache = (client: QueryClient): DmCache | undefined =>
      client.getQueryData<DmCache>(dmKey);
    const firstMessage = (
      client: QueryClient,
    ): DmMessageWithSendStatus | undefined =>
      readCache(client)?.pages[0]?.data[0];

    const emptyHistory = {
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    };

    it('marks the temp as error after SEND_TIMEOUT_MS without a server echo', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'oi' });
      });

      const temp = firstMessage(client);
      expect(temp?.sendStatus).toBe('sending');
      expect(temp?.id.startsWith('temp-')).toBe(true);
      const tempId = temp!.id;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });

      const after = firstMessage(client);
      expect(after?.id).toBe(tempId);
      expect(after?.sendStatus).toBe('error');
      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
    });

    it('clears the send timer when the server echo arrives before timeout', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'oi' });
      });
      const tempClientId = firstMessage(client)?.clientMessageId;
      expect(tempClientId).toBeTruthy();

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_DIRECT_MESSAGE,
          baseMessage({
            id: 'server-1',
            clientMessageId: tempClientId,
            senderId: 'me',
            senderName: 'Me',
            content: 'oi',
          }),
        );
      });

      expect(firstMessage(client)?.id).toBe('server-1');

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-1');
      expect(firstMessage(client)?.sendStatus).toBeUndefined();
    });

    it('replaces an errored temp when a late server echo arrives', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'late' });
      });
      const tempClientId = firstMessage(client)?.clientMessageId;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_DIRECT_MESSAGE,
          baseMessage({
            id: 'server-late',
            clientMessageId: tempClientId,
            senderId: 'me',
            senderName: 'Me',
            content: 'late',
          }),
        );
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-late');
    });

    it('does not error a temp after DM_REQUEST_SENT strips it', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'oi' });
      });
      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);

      act(() => {
        handle.fire(ChatSocketEvents.DM_REQUEST_SENT, { requestId: 'req-1' });
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(0);

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(0);
    });

    it('does not error a temp after NEW_DIRECT_MESSAGE type=request strips it', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'oi' });
      });

      act(() => {
        handle.fire(ChatSocketEvents.NEW_DIRECT_MESSAGE, {
          ...baseMessage({ id: 'req-msg' }),
          type: 'request',
        });
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(0);

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(0);
    });

    it('does not mutate cache from a fired timer after the hook unmounts', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result, unmount } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'bye' });
      });

      const cacheBefore = readCache(client);
      unmount();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(readCache(client)).toBe(cacheBefore);
    });
  });

  describe('retrySendMessage (E5)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    type DmMessageWithSendStatus = DirectMessage & {
      sendStatus?: 'sending' | 'sent' | 'error';
    };
    type DmCache = { pages: Array<{ data: DmMessageWithSendStatus[] }> };
    const dmKey = ['dm', 'history', 'peer-1'] as const;
    const readCache = (client: QueryClient): DmCache | undefined =>
      client.getQueryData<DmCache>(dmKey);
    const firstMessage = (
      client: QueryClient,
    ): DmMessageWithSendStatus | undefined =>
      readCache(client)?.pages[0]?.data[0];

    const emptyHistory = {
      data: [],
      lastReadAt: null,
      peerLastReadAt: null,
      next_cursor: null,
    };

    it("flips an errored temp back to 'sending' and re-emits send_dm with the same clientMessageId", async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({
          content: 'oi peer',
          replyTo: {
            id: 'parent-1',
            authorId: 'peer-1',
            snippet: 'original',
            isDeleted: false,
          },
        });
      });
      const temp = firstMessage(client);
      const tempId = temp!.id;
      const tempClientId = temp!.clientMessageId!;
      expect(tempClientId).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');
      (handle.manager.emit as jest.Mock).mockClear();

      act(() => {
        result.current.retrySendMessage(tempId);
      });

      expect(firstMessage(client)?.id).toBe(tempId);
      expect(firstMessage(client)?.sendStatus).toBe('sending');
      expect(handle.manager.emit).toHaveBeenCalledTimes(1);
      expect(handle.manager.emit).toHaveBeenCalledWith(
        ChatSocketEvents.SEND_DM,
        {
          recipientId: 'peer-1',
          content: 'oi peer',
          mediaUrl: null,
          mediaType: null,
          clientMessageId: tempClientId,
          replyToMessageId: 'parent-1',
        },
      );
    });

    it("re-arms the timeout so a failed retry flips back to 'error'", async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'oi' });
      });
      const tempId = firstMessage(client)!.id;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        result.current.retrySendMessage(tempId);
      });
      expect(firstMessage(client)?.sendStatus).toBe('sending');

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');
    });

    it('lets the server echo replace the retried temp via clientMessageId', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'late' });
      });
      const temp = firstMessage(client)!;

      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      expect(firstMessage(client)?.sendStatus).toBe('error');

      act(() => {
        result.current.retrySendMessage(temp.id);
      });

      act(() => {
        handle.fire(
          ChatSocketEvents.NEW_DIRECT_MESSAGE,
          baseMessage({
            id: 'server-late',
            clientMessageId: temp.clientMessageId,
            senderId: 'me',
            senderName: 'Me',
            content: 'late',
          }),
        );
      });

      expect(readCache(client)?.pages[0]?.data).toHaveLength(1);
      expect(firstMessage(client)?.id).toBe('server-late');
    });

    it('is a no-op when the message id is not in the cache', async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage('temp-does-not-exist');
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });

    it('is a no-op when the matched message is not a temp', async () => {
      mockedGetDmHistory.mockResolvedValueOnce({
        ...emptyHistory,
        data: [baseMessage({ id: 'dm-server', senderId: 'me' })],
      });

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage('dm-server');
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });

    it("is a no-op when the temp's sendStatus is not 'error'", async () => {
      mockedGetDmHistory.mockResolvedValueOnce(emptyHistory);
      const client = makeClient();

      const { result } = renderHook(() => useDmChat('peer-1'), {
        wrapper: makeWrapper(client),
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      jest.useFakeTimers();
      act(() => {
        result.current.sendMessage({ content: 'pending' });
      });
      const tempId = firstMessage(client)!.id;
      expect(firstMessage(client)?.sendStatus).toBe('sending');

      (handle.manager.emit as jest.Mock).mockClear();
      act(() => {
        result.current.retrySendMessage(tempId);
      });
      expect(handle.manager.emit).not.toHaveBeenCalled();
    });
  });
});
