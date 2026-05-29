import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  type GroupMessage,
  MemberRole,
} from '@localloop/shared-types';
import GroupChatScreen from './index';
import { useGroupChat } from '@/application/hooks/useGroupChat/useGroupChat';
import { messagesApi } from '@/infra/api/messages.api';

jest.mock('@/application/hooks/useGroupChat/useGroupChat', () => ({
  useGroupChat: jest.fn(),
  chatHistoryKey: (groupId: string) => ['chat', 'history', groupId] as const,
}));

jest.mock('@/infra/api/messages.api', () => ({
  messagesApi: { deleteMessage: jest.fn(() => Promise.resolve()) },
}));

const mockedUseGroupChat = useGroupChat as jest.MockedFunction<
  typeof useGroupChat
>;

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
} as unknown as Parameters<typeof GroupChatScreen>[0]['navigation'];

function makeQueryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderScreen = (
  params: { myRole?: MemberRole | null; groupName?: string } = {},
) =>
  render(
    <GroupChatScreen
      navigation={navigation}
      route={
        {
          key: 'GroupChat',
          name: 'GroupChat' as const,
          params: {
            groupId: 'g-1',
            groupName: params.groupName ?? 'Água verde',
            anchorType: AnchorType.NEIGHBORHOOD,
            myRole: params.myRole ?? MemberRole.MEMBER,
          },
        } as never
      }
    />,
    { wrapper: makeQueryWrapper() },
  );

const baseHookState = {
  messages: [] as GroupMessage[],
  messageStatuses: {} as Record<string, 'sending' | 'sent'>,
  loading: false,
  loadingMore: false,
  error: null,
  connected: true,
  onlineCount: 0,
  hasMore: false,
  currentUserId: 'me',
  sendMessage: jest.fn(),
  loadOlder: jest.fn(),
};

const baseMessage = (over: Partial<GroupMessage> = {}): GroupMessage => ({
  id: 'm-1',
  clientMessageId: null,
  senderId: 'u-other',
  senderName: 'Alice',
  senderAvatarUrl: null,
  content: 'hello',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
  ...over,
});

describe('GroupChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty state when no messages and not loading', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByText } = renderScreen();
    expect(
      getByText('Nenhuma mensagem ainda. Envie a primeira!'),
    ).toBeTruthy();
  });

  it('renders the group name in the header', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByText } = renderScreen({ groupName: 'Morumbi Runners' });
    expect(getByText('Morumbi Runners')).toBeTruthy();
  });

  it('renders message content and sender name from the hook', () => {
    mockedUseGroupChat.mockReturnValue({
      ...baseHookState,
      messages: [baseMessage({ content: 'Oi pessoal' })],
    });
    const { getByText } = renderScreen();
    expect(getByText('Oi pessoal')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
  });

  it('shows the peer sender name only once for consecutive messages from that sender', () => {
    mockedUseGroupChat.mockReturnValue({
      ...baseHookState,
      messages: [
        baseMessage({
          id: 'm-4',
          content: 'quarta',
          createdAt: '2026-04-24T10:03:00.000Z',
        }),
        baseMessage({
          id: 'm-3',
          content: 'terceira',
          createdAt: '2026-04-24T10:02:00.000Z',
        }),
        baseMessage({
          id: 'm-2',
          content: 'segunda',
          createdAt: '2026-04-24T10:01:00.000Z',
        }),
        baseMessage({
          id: 'm-1',
          content: 'primeira',
          createdAt: '2026-04-24T10:00:00.000Z',
        }),
      ],
    });

    const { getAllByText, getByText } = renderScreen();

    expect(getByText('primeira')).toBeTruthy();
    expect(getByText('quarta')).toBeTruthy();
    expect(getAllByText('Alice')).toHaveLength(1);
  });

  it('shows the peer sender name again after a different sender interrupts the sequence', () => {
    mockedUseGroupChat.mockReturnValue({
      ...baseHookState,
      messages: [
        baseMessage({
          id: 'm-5',
          content: 'alice volta',
          createdAt: '2026-04-24T10:04:00.000Z',
        }),
        baseMessage({
          id: 'm-4',
          senderId: 'u-bob',
          senderName: 'Bob',
          content: 'bob dois',
          createdAt: '2026-04-24T10:03:00.000Z',
        }),
        baseMessage({
          id: 'm-3',
          senderId: 'u-bob',
          senderName: 'Bob',
          content: 'bob um',
          createdAt: '2026-04-24T10:02:00.000Z',
        }),
        baseMessage({
          id: 'm-2',
          content: 'alice dois',
          createdAt: '2026-04-24T10:01:00.000Z',
        }),
        baseMessage({
          id: 'm-1',
          content: 'alice um',
          createdAt: '2026-04-24T10:00:00.000Z',
        }),
      ],
    });

    const { getAllByText } = renderScreen();

    expect(getAllByText('Alice')).toHaveLength(2);
    expect(getAllByText('Bob')).toHaveLength(1);
  });

  it('peer avatar navigates to DmChat with sender identity', () => {
    mockedUseGroupChat.mockReturnValue({
      ...baseHookState,
      messages: [
        baseMessage({
          senderId: 'u-alice',
          senderName: 'Alice Lima',
          senderAvatarUrl: 'https://example.com/alice.png',
        }),
      ],
    });
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('peer-avatar-u-alice'));

    expect(navigation.navigate).toHaveBeenCalledWith('DmChat', {
      peerId: 'u-alice',
      peerName: 'Alice Lima',
      peerAvatarUrl: 'https://example.com/alice.png',
    });
  });

  it('send button is a no-op when the draft is empty or whitespace', () => {
    const sendMessage = jest.fn();
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, sendMessage });
    const { getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByTestId('composer-send'));
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText('Escreva uma mensagem'), '   ');
    fireEvent.press(getByTestId('composer-send'));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('calls sendMessage with trimmed content and clears the input on send', async () => {
    const sendMessage = jest.fn();
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, sendMessage });
    const { getByTestId, getByPlaceholderText } = renderScreen();

    const input = getByPlaceholderText('Escreva uma mensagem');
    fireEvent.changeText(input, '  olá  ');
    fireEvent.press(getByTestId('composer-send'));

    expect(sendMessage).toHaveBeenCalledWith('olá');
    await waitFor(() => {
      expect(getByPlaceholderText('Escreva uma mensagem').props.value).toBe('');
    });
  });

  it('displays the error message when error=load_failed', () => {
    mockedUseGroupChat.mockReturnValue({
      ...baseHookState,
      error: 'load_failed',
    });
    const { getByText } = renderScreen();
    expect(getByText('Não foi possível carregar o histórico.')).toBeTruthy();
  });

  it('header back button navigates back', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('header-back'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('header title navigates to GroupDetail with groupId', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('header-title'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupDetail', {
      groupId: 'g-1',
    });
  });

  it('action sheet Members item navigates to GroupMembers forwarding myRole', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByTestId } = renderScreen({ myRole: MemberRole.OWNER });
    fireEvent.press(getByTestId('header-more'));
    fireEvent.press(getByTestId('group-action-members'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupMembers', {
      groupId: 'g-1',
      myRole: MemberRole.OWNER,
    });
  });

  it('renders the online-count subtitle when onlineCount > 0', () => {
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, onlineCount: 5 });
    const { getByTestId, getByText } = renderScreen();
    expect(getByTestId('header-subtitle')).toBeTruthy();
    expect(getByText('· 5 ONLINE ·')).toBeTruthy();
  });

  it('hides the online-count subtitle when onlineCount is 0', () => {
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, onlineCount: 0 });
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('header-subtitle')).toBeNull();
  });

  describe('per-message action sheet', () => {
    const mockedDelete = messagesApi.deleteMessage as jest.MockedFunction<
      typeof messagesApi.deleteMessage
    >;

    it('opens the sheet on long-press of an own message with all three actions', () => {
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [
          baseMessage({ id: 'mine-1', senderId: 'me', content: 'oi' }),
        ],
      });
      const { getByTestId } = renderScreen();

      fireEvent(getByTestId('own-bubble-mine-1'), 'onLongPress');

      expect(getByTestId('message-action-sheet')).toBeTruthy();
      expect(getByTestId('message-action-reply')).toBeTruthy();
      expect(getByTestId('message-action-edit')).toBeTruthy();
      expect(getByTestId('message-action-delete')).toBeTruthy();
    });

    it('opens the sheet on long-press of a peer message with only the reply action for MEMBER', () => {
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [baseMessage({ id: 'peer-1', senderId: 'u-other' })],
      });
      const { getByTestId, queryByTestId } = renderScreen({
        myRole: MemberRole.MEMBER,
      });

      fireEvent(getByTestId('peer-bubble-peer-1'), 'onLongPress');

      expect(getByTestId('message-action-reply')).toBeTruthy();
      expect(queryByTestId('message-action-edit')).toBeNull();
      expect(queryByTestId('message-action-delete')).toBeNull();
    });

    it('shows all actions on a peer message when myRole is MODERATOR', () => {
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [baseMessage({ id: 'peer-1', senderId: 'u-other' })],
      });
      const { getByTestId } = renderScreen({ myRole: MemberRole.MODERATOR });

      fireEvent(getByTestId('peer-bubble-peer-1'), 'onLongPress');

      expect(getByTestId('message-action-reply')).toBeTruthy();
      expect(getByTestId('message-action-edit')).toBeTruthy();
      expect(getByTestId('message-action-delete')).toBeTruthy();
    });

    it('does not open the sheet for a temp (still-sending) own message', () => {
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [
          baseMessage({ id: 'temp-abc', senderId: 'me', content: 'oi' }),
        ],
      });
      const { getByTestId, queryByTestId } = renderScreen();

      fireEvent(getByTestId('own-bubble-temp-abc'), 'onLongPress');

      expect(queryByTestId('message-action-sheet')).toBeNull();
    });

    it('does not open the sheet for an already-deleted message', () => {
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [
          baseMessage({ id: 'm-1', senderId: 'me', isDeleted: true }),
        ],
      });
      const { getByTestId, queryByTestId } = renderScreen();

      fireEvent(getByTestId('own-bubble-m-1'), 'onLongPress');

      expect(queryByTestId('message-action-sheet')).toBeNull();
    });

    it('tapping Delete calls the API with the message id', async () => {
      mockedDelete.mockClear();
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [
          baseMessage({ id: 'mine-1', senderId: 'me', content: 'oi' }),
        ],
      });
      const { getByTestId, queryByTestId } = renderScreen();

      fireEvent(getByTestId('own-bubble-mine-1'), 'onLongPress');
      fireEvent.press(getByTestId('message-action-delete'));

      await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('mine-1'));
      // Sheet closes on selection
      expect(queryByTestId('message-action-sheet')).toBeNull();
    });

    it('tapping the backdrop closes the sheet without firing an action', () => {
      mockedDelete.mockClear();
      mockedUseGroupChat.mockReturnValue({
        ...baseHookState,
        messages: [
          baseMessage({ id: 'mine-1', senderId: 'me', content: 'oi' }),
        ],
      });
      const { getByTestId, queryByTestId } = renderScreen();

      fireEvent(getByTestId('own-bubble-mine-1'), 'onLongPress');
      fireEvent.press(getByTestId('message-action-sheet-backdrop'));

      expect(queryByTestId('message-action-sheet')).toBeNull();
      expect(mockedDelete).not.toHaveBeenCalled();
    });
  });
});
