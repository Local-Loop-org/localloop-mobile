import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import InboxScreen from './index';
import type { InboxScreenProps } from './types';

const navigation = {
  navigate: jest.fn(),
} as unknown as InboxScreenProps['navigation'];

const route = {
  key: 'Inbox',
  name: 'Inbox' as const,
} as InboxScreenProps['route'];

const renderScreen = () =>
  render(<InboxScreen navigation={navigation} route={route} />);

describe('InboxScreen', () => {
  it('renders the header with title and conversation totals', () => {
    const { getByText } = renderScreen();
    expect(getByText('Inbox')).toBeTruthy();
    // mock data has 10 active conversations
    expect(getByText(/10 CONVERSAS/)).toBeTruthy();
    expect(getByText(/2 NÃO LIDAS/)).toBeTruthy();
  });

  it('renders all four filter chips with their counts', () => {
    const { getByLabelText } = renderScreen();
    expect(getByLabelText('Todas, 10')).toBeTruthy();
    expect(getByLabelText('Não lidas, 2')).toBeTruthy();
    expect(getByLabelText('Solicitações, 3')).toBeTruthy();
    expect(getByLabelText('Arquivadas, 0')).toBeTruthy();
  });

  it('renders the search input with the inbox placeholder', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('Buscar pessoas ou mensagens…')).toBeTruthy();
  });

  it('shows only unread rows when the "Não lidas" chip is tapped', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Não lidas'));
    expect(getByText('Ana Beatriz')).toBeTruthy();
    expect(getByText('Julia M.')).toBeTruthy();
    expect(queryByText('Rafael Souza')).toBeNull();
    expect(queryByText('Carlos P.')).toBeNull();
  });

  it('shows request rows when the "Solicitações" chip is tapped', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Solicitações'));
    expect(getByText('Helena S.')).toBeTruthy();
    expect(getByText('Thiago A.')).toBeTruthy();
    expect(getByText('Bia N.')).toBeTruthy();
    expect(queryByText('Ana Beatriz')).toBeNull();
  });

  it('shows the archived empty state when no DMs are archived', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Arquivadas'));
    expect(getByText('Nenhuma conversa arquivada.')).toBeTruthy();
  });

  it('filters by display name as the user types', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Buscar pessoas ou mensagens…'),
      'rafa',
    );
    expect(getByText('Rafael Souza')).toBeTruthy();
    expect(queryByText('Ana Beatriz')).toBeNull();
  });
});
