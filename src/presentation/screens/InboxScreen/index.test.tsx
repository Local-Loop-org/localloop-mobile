import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useDmConversations } from '@/application/hooks/useDmConversations/useDmConversations';
import type { UseDmConversationsResult } from '@/application/hooks/useDmConversations/useDmConversations';
import { useDmRequests } from '@/application/hooks/useDmRequests/useDmRequests';
import type { UseDmRequestsResult } from '@/application/hooks/useDmRequests/useDmRequests';
import type { DmConversationDto, DmRequestDto } from '@/infra/api/dm.api';
import InboxScreen from './index';
import type { InboxScreenProps } from './types';

jest.mock('@/application/hooks/useDmConversations/useDmConversations', () => ({
  useDmConversations: jest.fn(),
}));

jest.mock('@/application/hooks/useDmRequests/useDmRequests', () => ({
  useDmRequests: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useIsFocused: () => true,
  };
});

const mockedUseDmConversations = useDmConversations as jest.MockedFunction<
  typeof useDmConversations
>;
const mockedUseDmRequests = useDmRequests as jest.MockedFunction<
  typeof useDmRequests
>;

const navigation = {
  navigate: jest.fn(),
} as unknown as InboxScreenProps['navigation'];

const route = {
  key: 'Inbox',
  name: 'Inbox' as const,
} as InboxScreenProps['route'];

const renderScreen = () =>
  render(<InboxScreen navigation={navigation} route={route} />);

const conversation = (
  overrides: Partial<DmConversationDto> = {},
): DmConversationDto => ({
  peerId: 'u-ana',
  peerName: 'Ana Beatriz',
  peerAvatarUrl: null,
  lastMessage: {
    content: 'Levo agua extra',
    senderName: 'Ana Beatriz',
    createdAt: '2026-05-18T10:00:00.000Z',
  },
  unreadCount: 0,
  archived: false,
  ...overrides,
});

const request = (overrides: Partial<DmRequestDto> = {}): DmRequestDto => ({
  id: 'req-1',
  senderId: 'u-helena',
  senderName: 'Helena S.',
  senderAvatarUrl: null,
  content: 'oi vizinha',
  createdAt: '2026-05-18T10:00:00.000Z',
  ...overrides,
});

const conversationsFixture: DmConversationDto[] = [
  conversation({
    peerId: 'u-ana',
    peerName: 'Ana Beatriz',
    unreadCount: 3,
  }),
  conversation({
    peerId: 'u-rafa',
    peerName: 'Rafael Souza',
    lastMessage: {
      content: 'vejo depois',
      senderName: 'Me',
      createdAt: '2026-05-18T09:00:00.000Z',
    },
  }),
  conversation({
    peerId: 'u-julia',
    peerName: 'Julia M.',
    lastMessage: {
      content: 'Você viu o evento?',
      senderName: 'Julia M.',
      createdAt: '2026-05-18T08:00:00.000Z',
    },
    unreadCount: 1,
  }),
  conversation({
    peerId: 'u-arch',
    peerName: 'Arquivo',
    archived: true,
  }),
];

const requestsFixture: DmRequestDto[] = [
  request({ id: 'req-1', senderId: 'u-helena', senderName: 'Helena S.' }),
  request({
    id: 'req-2',
    senderId: 'u-thiago',
    senderName: 'Thiago A.',
    content: 'Tu vai amanhã?',
  }),
];

function mockConversations(
  overrides: Partial<UseDmConversationsResult> = {},
) {
  mockedUseDmConversations.mockReturnValue({
    conversations: conversationsFixture,
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: jest.fn(),
    query: {} as never,
    ...overrides,
  });
}

function mockRequests(overrides: Partial<UseDmRequestsResult> = {}) {
  mockedUseDmRequests.mockReturnValue({
    requests: requestsFixture,
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: jest.fn(),
    query: {} as never,
    ...overrides,
  });
}

describe('InboxScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConversations();
    mockRequests();
  });

  it('renders the header with loaded conversation totals', () => {
    const { getByText } = renderScreen();

    expect(mockedUseDmConversations).toHaveBeenCalledWith({ enabled: true });
    expect(mockedUseDmRequests).toHaveBeenCalledWith({ enabled: true });
    expect(getByText('Inbox')).toBeTruthy();
    expect(getByText(/3 CONVERSAS/)).toBeTruthy();
    expect(getByText(/2 NÃO LIDAS/)).toBeTruthy();
  });

  it('renders all four filter chips with loaded counts', () => {
    const { getByLabelText } = renderScreen();

    expect(getByLabelText('Todas, 3')).toBeTruthy();
    expect(getByLabelText('Não lidas, 2')).toBeTruthy();
    expect(getByLabelText('Solicitações, 2')).toBeTruthy();
    expect(getByLabelText('Arquivadas, 1')).toBeTruthy();
  });

  it('shows only unread rows when the unread chip is tapped', () => {
    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Não lidas'));

    expect(getByText('Ana Beatriz')).toBeTruthy();
    expect(getByText('Julia M.')).toBeTruthy();
    expect(queryByText('Rafael Souza')).toBeNull();
    expect(queryByText('Arquivo')).toBeNull();
  });

  it('shows request rows with disabled actions when Solicitações is tapped', () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Solicitações'));

    expect(getByText('Helena S.')).toBeTruthy();
    expect(getByText('Thiago A.')).toBeTruthy();
    expect(queryByText('Ana Beatriz')).toBeNull();
    expect(
      getByTestId('dm-request-accept-req-1').props.accessibilityState.disabled,
    ).toBe(true);
    expect(
      getByTestId('dm-request-ignore-req-1').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('filters conversations by display name as the user types', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderScreen();

    fireEvent.changeText(
      getByPlaceholderText('Buscar pessoas ou mensagens…'),
      'rafa',
    );

    expect(getByText('Rafael Souza')).toBeTruthy();
    expect(queryByText('Ana Beatriz')).toBeNull();
  });

  it('shows the archived rows under the archived chip', () => {
    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Arquivadas'));

    expect(getByText('Arquivo')).toBeTruthy();
    expect(queryByText('Ana Beatriz')).toBeNull();
  });

  it('navigates a conversation row to DmChat', () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('dm-row-u-rafa'));

    expect(navigation.navigate).toHaveBeenCalledWith('DmChat', {
      peerId: 'u-rafa',
      peerName: 'Rafael Souza',
      peerAvatarUrl: null,
    });
  });

  it('loads more conversations from the active conversation list', () => {
    const loadMore = jest.fn();
    mockConversations({ loadMore, hasNextPage: true });
    const { getByTestId } = renderScreen();

    fireEvent(getByTestId('dm-conversations-list'), 'onEndReached');

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('loads more requests from the requests list', () => {
    const loadMore = jest.fn();
    mockRequests({ loadMore, hasNextPage: true });
    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Solicitações'));
    fireEvent(getByTestId('dm-requests-list'), 'onEndReached');

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('renders the loading state for the active list', () => {
    mockConversations({ conversations: [], isLoading: true });

    const { getByTestId } = renderScreen();

    expect(getByTestId('inbox-loading')).toBeTruthy();
  });

  it('renders the error state for the active list', () => {
    mockConversations({ conversations: [], isError: true });

    const { getByText } = renderScreen();

    expect(getByText('Não foi possível carregar as conversas.')).toBeTruthy();
  });
});
