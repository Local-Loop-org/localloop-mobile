import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ChatMessage } from '@/infra/api/messages.api';
import { formatTime } from '@/shared/format/chat';
import { OwnBubble } from './OwnBubble';
import { PeerBubble } from './PeerBubble';

const baseMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  senderId: 'u-other',
  senderName: 'Alice',
  senderAvatar: null,
  content: 'Oi pessoal',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  ...overrides,
});

describe('chat bubbles', () => {
  it('hides an own-message timestamp by default', () => {
    const message = baseMessage({ id: 'own-1' });

    const { getByText, queryByTestId } = render(
      <OwnBubble message={message} />,
    );

    expect(getByText('Oi pessoal')).toBeTruthy();
    expect(queryByTestId('own-timestamp-own-1')).toBeNull();
  });

  it('toggles an own-message timestamp when the bubble is pressed', () => {
    const message = baseMessage({ id: 'own-1' });

    const { getByTestId, queryByTestId } = render(
      <OwnBubble message={message} />,
    );

    fireEvent.press(getByTestId('own-bubble-own-1'));

    expect(getByTestId('own-timestamp-own-1').props.children).toBe(
      formatTime(message.createdAt),
    );

    fireEvent.press(getByTestId('own-bubble-own-1'));

    expect(queryByTestId('own-timestamp-own-1')).toBeNull();
  });

  it('toggles a peer-message timestamp when the bubble is pressed', () => {
    const message = baseMessage({ id: 'peer-1' });

    const { getByText, getByTestId, queryByTestId } = render(
      <PeerBubble message={message} />,
    );

    expect(getByText('Oi pessoal')).toBeTruthy();
    expect(queryByTestId('peer-timestamp-peer-1')).toBeNull();

    fireEvent.press(getByTestId('peer-bubble-peer-1'));

    expect(getByTestId('peer-timestamp-peer-1').props.children).toBe(
      formatTime(message.createdAt),
    );

    fireEvent.press(getByTestId('peer-bubble-peer-1'));

    expect(queryByTestId('peer-timestamp-peer-1')).toBeNull();
  });

  it('keeps peer avatar presses independent from timestamp toggling', () => {
    const onPressAvatar = jest.fn();
    const message = baseMessage({ id: 'peer-1', senderId: 'u-alice' });

    const { getByTestId, queryByTestId } = render(
      <PeerBubble message={message} onPressAvatar={onPressAvatar} />,
    );

    fireEvent.press(getByTestId('peer-avatar-u-alice'));

    expect(onPressAvatar).toHaveBeenCalledTimes(1);
    expect(queryByTestId('peer-timestamp-peer-1')).toBeNull();
  });
});
