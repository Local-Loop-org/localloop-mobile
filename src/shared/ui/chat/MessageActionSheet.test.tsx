import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MessageActionSheet } from './MessageActionSheet';

describe('MessageActionSheet', () => {
  it('renders only the actions the policy enables', () => {
    const { queryByTestId } = render(
      <MessageActionSheet
        messagePreview='Olá'
        available={{ canReply: true, canEdit: false, canDelete: false }}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    expect(queryByTestId('message-action-reply')).toBeTruthy();
    expect(queryByTestId('message-action-edit')).toBeNull();
    expect(queryByTestId('message-action-delete')).toBeNull();
  });

  it('renders all three rows when policy allows everything', () => {
    const { getByTestId } = render(
      <MessageActionSheet
        messagePreview='Olá'
        available={{ canReply: true, canEdit: true, canDelete: true }}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId('message-action-reply')).toBeTruthy();
    expect(getByTestId('message-action-edit')).toBeTruthy();
    expect(getByTestId('message-action-delete')).toBeTruthy();
  });

  it('returns null when no actions are available', () => {
    const { queryByTestId } = render(
      <MessageActionSheet
        messagePreview='Olá'
        available={{ canReply: false, canEdit: false, canDelete: false }}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    expect(queryByTestId('message-action-sheet')).toBeNull();
  });

  it('fires onSelect with the row id when an action is tapped', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <MessageActionSheet
        messagePreview='Olá'
        available={{ canReply: true, canEdit: true, canDelete: true }}
        onClose={jest.fn()}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(getByTestId('message-action-delete'));
    expect(onSelect).toHaveBeenCalledWith('delete');

    fireEvent.press(getByTestId('message-action-reply'));
    expect(onSelect).toHaveBeenCalledWith('reply');
  });

  it('fires onClose when the backdrop is tapped', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <MessageActionSheet
        messagePreview='Olá'
        available={{ canReply: true, canEdit: false, canDelete: false }}
        onClose={onClose}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('message-action-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('truncates a long message preview', () => {
    const long = 'A'.repeat(150);
    const { getByTestId } = render(
      <MessageActionSheet
        messagePreview={long}
        available={{ canReply: true, canEdit: false, canDelete: false }}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    const previewText = getByTestId('message-action-sheet-preview').props
      .children as string;
    expect(previewText.length).toBeLessThanOrEqual(81); // 80 + …
    expect(previewText.endsWith('…')).toBe(true);
  });

  it('falls back to a generic header for empty previews', () => {
    const { getByTestId } = render(
      <MessageActionSheet
        messagePreview=''
        available={{ canReply: true, canEdit: false, canDelete: false }}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId('message-action-sheet-preview').props.children).toBe(
      'Mensagem',
    );
  });
});
