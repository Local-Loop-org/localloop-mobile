import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ChatMessage } from '@localloop/shared-types';
import { formatTime } from '@/shared/format/chat';
import { OwnBubble } from './OwnBubble';
import { PeerBubble } from './PeerBubble';

const baseMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm-1',
  clientMessageId: null,
  senderId: 'u-other',
  senderName: 'Alice',
  senderAvatarUrl: null,
  content: 'Oi pessoal',
  mediaUrl: null,
  mediaType: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  replyTo: null,
  isDeleted: false,
  editedAt: null,
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

    expect(getByTestId('own-timestamp-own-1')).toHaveTextContent(
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

    expect(getByTestId('peer-timestamp-peer-1')).toHaveTextContent(
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

  it('fires onLongPress on own bubble long-press', () => {
    const onLongPress = jest.fn();
    const message = baseMessage({ id: 'own-1' });

    const { getByTestId } = render(
      <OwnBubble message={message} onLongPress={onLongPress} />,
    );

    fireEvent(getByTestId('own-bubble-own-1'), 'onLongPress');

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('fires onLongPress on peer bubble long-press', () => {
    const onLongPress = jest.fn();
    const message = baseMessage({ id: 'peer-1' });

    const { getByTestId } = render(
      <PeerBubble message={message} onLongPress={onLongPress} />,
    );

    fireEvent(getByTestId('peer-bubble-peer-1'), 'onLongPress');

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});

describe('OwnBubble enhanced mode · status indicator', () => {
  // Enhanced mode is triggered when `previousMessage` or `nextMessage` is
  // passed. `nextMessage={null}` also forces `lastOfRun=true`, which is the
  // branch that renders the status row.
  const renderEnhanced = (status?: 'sending' | 'sent' | 'read') =>
    render(
      <OwnBubble
        message={baseMessage({ id: 'own-1', senderId: 'me' })}
        previousMessage={null}
        nextMessage={null}
        status={status}
      />,
    );

  it("shows the sending indicator when status is 'sending'", () => {
    const { getByTestId, queryByTestId } = renderEnhanced('sending');

    expect(getByTestId('own-status-sending')).toBeTruthy();
    expect(queryByTestId('own-status-sent')).toBeNull();
    expect(queryByTestId('own-status-read')).toBeNull();
  });

  it("shows the sent indicator when status is 'sent'", () => {
    const { getByTestId, queryByTestId } = renderEnhanced('sent');

    expect(getByTestId('own-status-sent')).toBeTruthy();
    expect(queryByTestId('own-status-sending')).toBeNull();
    expect(queryByTestId('own-status-read')).toBeNull();
  });

  it("shows the read indicator when status is 'read'", () => {
    const { getByTestId, queryByTestId } = renderEnhanced('read');

    expect(getByTestId('own-status-read')).toBeTruthy();
    expect(queryByTestId('own-status-sending')).toBeNull();
    expect(queryByTestId('own-status-sent')).toBeNull();
  });

  it('renders only the timestamp row when status is undefined', () => {
    const { queryByTestId } = renderEnhanced(undefined);

    expect(queryByTestId('own-status-sending')).toBeNull();
    expect(queryByTestId('own-status-sent')).toBeNull();
    expect(queryByTestId('own-status-read')).toBeNull();
  });
});

describe('chat bubbles · editado suffix', () => {
  it('renders the suffix in the own status row when editedAt is set', () => {
    const message = baseMessage({
      id: 'own-1',
      senderId: 'me',
      editedAt: '2026-05-30T10:05:00.000Z',
    });

    const { getByTestId } = render(
      <OwnBubble
        message={message}
        previousMessage={null}
        nextMessage={null}
        status='sent'
      />,
    );

    const suffix = getByTestId('own-edited-suffix');
    expect(suffix).toBeTruthy();
    expect(suffix.props.children).toBe('editado');
    // sibling of the status testID — still in the same row
    expect(getByTestId('own-status-sent')).toBeTruthy();
  });

  it('omits the suffix from the own status row when editedAt is null', () => {
    const message = baseMessage({
      id: 'own-1',
      senderId: 'me',
      editedAt: null,
    });

    const { queryByTestId } = render(
      <OwnBubble
        message={message}
        previousMessage={null}
        nextMessage={null}
        status='sent'
      />,
    );

    expect(queryByTestId('own-edited-suffix')).toBeNull();
  });

  it("omits the suffix while status is 'sending' even if editedAt is set", () => {
    const message = baseMessage({
      id: 'own-1',
      senderId: 'me',
      editedAt: '2026-05-30T10:05:00.000Z',
    });

    const { queryByTestId } = render(
      <OwnBubble
        message={message}
        previousMessage={null}
        nextMessage={null}
        status='sending'
      />,
    );

    expect(queryByTestId('own-status-sending')).toBeTruthy();
    expect(queryByTestId('own-edited-suffix')).toBeNull();
  });

  it('reveals the suffix when tapping a legacy own bubble whose editedAt is set', () => {
    const message = baseMessage({
      id: 'own-legacy',
      senderId: 'me',
      editedAt: '2026-05-30T10:05:00.000Z',
    });

    const { getByTestId, queryByTestId } = render(<OwnBubble message={message} />);

    expect(queryByTestId('own-edited-suffix-own-legacy')).toBeNull();

    fireEvent.press(getByTestId('own-bubble-own-legacy'));

    expect(getByTestId('own-timestamp-own-legacy')).toBeTruthy();
    expect(getByTestId('own-edited-suffix-own-legacy')).toBeTruthy();
  });

  it('renders the suffix on a peer bubble lastOfRun when editedAt is set', () => {
    const message = baseMessage({
      id: 'peer-1',
      editedAt: '2026-05-30T10:05:00.000Z',
    });

    const { getByTestId } = render(
      <PeerBubble
        message={message}
        previousMessage={null}
        nextMessage={null}
      />,
    );

    expect(getByTestId('peer-timestamp-peer-1')).toBeTruthy();
    expect(getByTestId('peer-edited-suffix-peer-1')).toBeTruthy();
  });

  it('omits the suffix on a peer bubble lastOfRun when editedAt is null', () => {
    const message = baseMessage({ id: 'peer-1', editedAt: null });

    const { queryByTestId } = render(
      <PeerBubble
        message={message}
        previousMessage={null}
        nextMessage={null}
      />,
    );

    expect(queryByTestId('peer-edited-suffix-peer-1')).toBeNull();
  });

  it('reveals the suffix when tapping a legacy peer bubble whose editedAt is set', () => {
    const message = baseMessage({
      id: 'peer-legacy',
      editedAt: '2026-05-30T10:05:00.000Z',
    });

    const { getByTestId, queryByTestId } = render(<PeerBubble message={message} />);

    expect(queryByTestId('peer-edited-suffix-peer-legacy')).toBeNull();

    fireEvent.press(getByTestId('peer-bubble-peer-legacy'));

    expect(getByTestId('peer-timestamp-peer-legacy')).toBeTruthy();
    expect(getByTestId('peer-edited-suffix-peer-legacy')).toBeTruthy();
  });
});
