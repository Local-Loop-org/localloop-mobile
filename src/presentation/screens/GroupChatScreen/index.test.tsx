import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AnchorType, MemberRole } from '@localloop/shared-types';
import GroupChatScreen from './index';
import { useGroupChat } from '@/application/hooks/useGroupChat';
import type { ChatMessage } from '@/infra/api/messages.api';

jest.mock('@/application/hooks/useGroupChat', () => ({
  useGroupChat: jest.fn(),
}));

const mockedUseGroupChat = useGroupChat as jest.MockedFunction<
  typeof useGroupChat
>;

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
} as unknown as Parameters<typeof GroupChatScreen>[0]['navigation'];

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
  );

const baseHookState = {
  messages: [] as ChatMessage[],
  loading: false,
  loadingMore: false,
  error: null,
  connected: true,
  hasMore: false,
  currentUserId: 'me',
  sendMessage: jest.fn(),
  loadOlder: jest.fn(),
};

const baseMessage = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  senderId: 'u-other',
  senderName: 'Alice',
  senderAvatar: null,
  content: 'hello',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
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

  it('send button is a no-op when the draft is empty or whitespace', () => {
    const sendMessage = jest.fn();
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, sendMessage });
    const { getByTestId, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByTestId('send-button'));
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText('Escreva uma mensagem'), '   ');
    fireEvent.press(getByTestId('send-button'));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('calls sendMessage with trimmed content and clears the input on send', async () => {
    const sendMessage = jest.fn();
    mockedUseGroupChat.mockReturnValue({ ...baseHookState, sendMessage });
    const { getByTestId, getByPlaceholderText } = renderScreen();

    const input = getByPlaceholderText('Escreva uma mensagem');
    fireEvent.changeText(input, '  olá  ');
    fireEvent.press(getByTestId('send-button'));

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

  it('header members icon navigates to GroupMembers forwarding myRole', () => {
    mockedUseGroupChat.mockReturnValue(baseHookState);
    const { getByTestId } = renderScreen({ myRole: MemberRole.OWNER });
    fireEvent.press(getByTestId('header-members'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupMembers', {
      groupId: 'g-1',
      myRole: MemberRole.OWNER,
    });
  });
});
