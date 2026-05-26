import React from 'react';
import { render } from '@testing-library/react-native';
import DmChatLayout from './index';
import type { DmChatLayoutProps } from './types';

const baseProps: DmChatLayoutProps = {
  peerName: 'Alice',
  peerAvatarUrl: null,
  peerStatus: null,
  messages: [],
  currentUserId: 'me',
  loading: false,
  loadingMore: false,
  hasMore: false,
  errorMessage: null,
  awaitingApproval: false,
  draft: '',
  onChangeDraft: jest.fn(),
  onSend: jest.fn(),
  onLoadOlder: jest.fn(),
  onBack: jest.fn(),
  onPressHeader: jest.fn(),
  onPressMore: jest.fn(),
  moreDisabled: false,
};

function renderLayout(overrides: Partial<DmChatLayoutProps> = {}) {
  return render(<DmChatLayout {...baseProps} {...overrides} />);
}

describe('DmChatLayout', () => {
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
});
