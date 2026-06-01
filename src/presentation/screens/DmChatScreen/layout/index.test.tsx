import React from 'react';
import { render } from '@testing-library/react-native';
import type { ChatMessage } from '@localloop/shared-types';
import { OwnBubble } from '@/shared/ui/chat/OwnBubble';
import { PeerBubble } from '@/shared/ui/chat/PeerBubble';
import DmChatLayout from './index';
import type { DmChatLayoutProps } from './types';

jest.mock('@/shared/ui/chat/OwnBubble', () => ({
  OwnBubble: jest.fn(({ message }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID={`own-bubble-${message.id}`}>{message.content}</Text>;
  }),
}));

jest.mock('@/shared/ui/chat/PeerBubble', () => ({
  PeerBubble: jest.fn(({ message }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID={`peer-bubble-${message.id}`}>{message.content}</Text>;
  }),
}));

const mockOwnBubble = OwnBubble as jest.Mock;
const mockPeerBubble = PeerBubble as jest.Mock;

const baseProps: DmChatLayoutProps = {
  peerName: 'Alice',
  peerAvatarUrl: null,
  peerStatus: null,
  messages: [],
  messageStatuses: {},
  currentUserId: 'me',
  loading: false,
  loadingMore: false,
  hasMore: false,
  errorMessage: null,
  awaitingApproval: false,
  archived: false,
  draft: '',
  composingReplyTo: null,
  composingEdit: null,
  editError: null,
  onDismissEditError: jest.fn(),
  actionSheetOpen: false,
  onChangeDraft: jest.fn(),
  onSend: jest.fn(),
  onLoadOlder: jest.fn(),
  onBack: jest.fn(),
  onPressHeader: jest.fn(),
  onPressMore: jest.fn(),
  onCloseActionSheet: jest.fn(),
  onSelectAction: jest.fn(),
  onCancelRequest: jest.fn(),
  moreDisabled: false,
  messageActionSheet: null,
  onLongPressMessage: jest.fn(),
  onSwipeReply: jest.fn(),
  onPressRetry: jest.fn(),
  onSelectMessageAction: jest.fn(),
  onCloseMessageActionSheet: jest.fn(),
};

function renderLayout(overrides: Partial<DmChatLayoutProps> = {}) {
  return render(<DmChatLayout {...baseProps} {...overrides} />);
}

const baseMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  clientMessageId: null,
  senderId: 'me',
  senderName: 'Me',
  senderAvatarUrl: null,
  content: 'Oi',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-05-27T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
  ...overrides,
});

describe('DmChatLayout', () => {
  beforeEach(() => {
    mockOwnBubble.mockClear();
    mockPeerBubble.mockClear();
  });

  it('renders the peer online dot and subtitle when presence is online', () => {
    const { getByTestId, getByText } = renderLayout({
      peerStatus: { kind: 'online' },
    });

    expect(getByTestId('header-peer-online-dot')).toBeTruthy();
    expect(getByText('Online')).toBeTruthy();
  });

  it('hides the peer online dot and subtitle when presence is unavailable', () => {
    const { queryByTestId, queryByText } = renderLayout({
      peerStatus: null,
    });

    expect(queryByTestId('header-peer-online-dot')).toBeNull();
    expect(queryByText('Online')).toBeNull();
  });

  it('passes read status only to own DM bubbles', () => {
    renderLayout({
      messages: [
        baseMessage({ id: 'own-1', senderId: 'me' }),
        baseMessage({
          id: 'peer-1',
          senderId: 'peer-1',
          senderName: 'Alice',
        }),
      ],
      messageStatuses: {
        'own-1': 'read',
        'peer-1': 'sent',
      },
    });

    const ownCall = mockOwnBubble.mock.calls.find(
      ([props]) => props.message.id === 'own-1',
    );
    const peerCall = mockPeerBubble.mock.calls.find(
      ([props]) => props.message.id === 'peer-1',
    );

    expect(ownCall?.[0].status).toBe('read');
    expect(peerCall?.[0]).not.toHaveProperty('status');
  });
});
