import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useArchiveDmConversation } from '@/application/hooks/useArchiveDmConversation/useArchiveDmConversation';
import { useDmChat } from '@/application/hooks/useDmChat/useDmChat';
import { useDmPresence } from '@/application/hooks/useDmPresence/useDmPresence';
import { useDmReadState } from '@/application/hooks/useDmReadState/useDmReadState';
import { useUnarchiveDmConversation } from '@/application/hooks/useUnarchiveDmConversation/useUnarchiveDmConversation';
import DmChatScreen from './index';
import type { DmChatScreenProps } from './types';

jest.mock('@/application/hooks/useDmChat/useDmChat', () => ({
  useDmChat: jest.fn(),
}));

jest.mock('@/application/hooks/useDmPresence/useDmPresence', () => ({
  useDmPresence: jest.fn(),
}));

jest.mock('@/application/hooks/useDmReadState/useDmReadState', () => ({
  useDmReadState: jest.fn(),
}));

jest.mock(
  '@/application/hooks/useArchiveDmConversation/useArchiveDmConversation',
  () => ({
    useArchiveDmConversation: jest.fn(),
  }),
);

jest.mock(
  '@/application/hooks/useUnarchiveDmConversation/useUnarchiveDmConversation',
  () => ({
    useUnarchiveDmConversation: jest.fn(),
  }),
);

jest.mock('./layout', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');

  return function MockDmChatLayout(props: {
    messageStatuses: unknown;
    moreDisabled?: boolean;
    onPressMore: () => void;
    peerStatus: unknown;
    actionSheetOpen: boolean;
    archived: boolean;
    onSelectAction: (id: string) => void;
  }) {
    return (
      <View>
        <Text testID="message-statuses">
          {JSON.stringify(props.messageStatuses)}
        </Text>
        <Text testID="more-disabled">{String(!!props.moreDisabled)}</Text>
        <Text testID="peer-status">{JSON.stringify(props.peerStatus)}</Text>
        <Text testID="action-sheet-open">{String(props.actionSheetOpen)}</Text>
        <Text testID="archived">{String(props.archived)}</Text>
        <TouchableOpacity testID="header-more" onPress={props.onPressMore}>
          <Text>more</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="select-archive"
          onPress={() => props.onSelectAction('archive')}
        >
          <Text>archive</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

const mockedUseDmChat = useDmChat as jest.MockedFunction<typeof useDmChat>;
const mockedUseDmPresence = useDmPresence as jest.MockedFunction<
  typeof useDmPresence
>;
const mockedUseDmReadState = useDmReadState as jest.MockedFunction<
  typeof useDmReadState
>;
const mockedUseArchiveDmConversation =
  useArchiveDmConversation as jest.MockedFunction<
    typeof useArchiveDmConversation
  >;
const mockedUseUnarchiveDmConversation =
  useUnarchiveDmConversation as jest.MockedFunction<
    typeof useUnarchiveDmConversation
  >;

const archiveMutate = jest.fn();
const unarchiveMutate = jest.fn();

const navigation = {
  goBack: jest.fn(),
} as unknown as DmChatScreenProps['navigation'];

function makeRoute(
  initialArchived = false,
): DmChatScreenProps['route'] {
  return {
    key: 'DmChat',
    name: 'DmChat',
    params: {
      peerId: 'peer-1',
      peerName: 'Alice',
      peerAvatarUrl: null,
      initialArchived,
    },
  };
}

function renderScreen(initialArchived = false) {
  return render(
    <DmChatScreen
      navigation={navigation}
      route={makeRoute(initialArchived)}
    />,
  );
}

describe('DmChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockedUseDmChat.mockReturnValue({
      messages: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      currentUserId: 'me',
      awaitingApproval: false,
      sendMessage: jest.fn(),
      loadOlder: jest.fn(),
      connected: true,
    } as never);
    mockedUseDmPresence.mockReturnValue(null);
    mockedUseDmReadState.mockReturnValue({
      lastReadAt: null,
      peerLastReadAt: null,
      messageStatuses: {},
    });
    mockedUseArchiveDmConversation.mockReturnValue({
      mutate: archiveMutate,
      isPending: false,
    } as never);
    mockedUseUnarchiveDmConversation.mockReturnValue({
      mutate: unarchiveMutate,
      isPending: false,
    } as never);
  });

  it('opens the action sheet and fires archive when selected', () => {
    const { getByTestId } = renderScreen(false);

    expect(getByTestId('action-sheet-open').props.children).toBe('false');
    expect(getByTestId('archived').props.children).toBe('false');

    fireEvent.press(getByTestId('header-more'));
    expect(getByTestId('action-sheet-open').props.children).toBe('true');

    act(() => {
      fireEvent.press(getByTestId('select-archive'));
    });

    expect(archiveMutate).toHaveBeenCalledWith(
      'peer-1',
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(getByTestId('action-sheet-open').props.children).toBe('false');
  });

  it('fires unarchive when selected for initially archived conversations', () => {
    const { getByTestId } = renderScreen(true);

    expect(getByTestId('archived').props.children).toBe('true');

    fireEvent.press(getByTestId('header-more'));
    act(() => {
      fireEvent.press(getByTestId('select-archive'));
    });

    expect(unarchiveMutate).toHaveBeenCalledWith(
      'peer-1',
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('shows an error alert when archive fails', () => {
    const { getByTestId } = renderScreen(false);
    fireEvent.press(getByTestId('header-more'));

    act(() => {
      fireEvent.press(getByTestId('select-archive'));
    });
    act(() => {
      archiveMutate.mock.calls[0][1].onError();
    });

    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Erro',
      'Não foi possível arquivar a conversa.',
    );
  });

  it('disables the header menu while archive mutations are pending', () => {
    mockedUseArchiveDmConversation.mockReturnValue({
      mutate: archiveMutate,
      isPending: true,
    } as never);

    const { getByTestId } = renderScreen(false);

    expect(getByTestId('more-disabled').props.children).toBe('true');
  });

  it('passes DM presence status into the layout', () => {
    mockedUseDmPresence.mockReturnValue({ kind: 'online' });

    const { getByTestId } = renderScreen(false);

    expect(mockedUseDmPresence).toHaveBeenCalledWith('peer-1');
    expect(getByTestId('peer-status').props.children).toBe(
      JSON.stringify({ kind: 'online' }),
    );
  });

  it('passes DM read statuses into the layout', () => {
    mockedUseDmReadState.mockReturnValue({
      lastReadAt: null,
      peerLastReadAt: '2026-05-27T10:00:00.000Z',
      messageStatuses: { 'dm-1': 'read' },
    });

    const { getByTestId } = renderScreen(false);

    expect(mockedUseDmReadState).toHaveBeenCalledWith('peer-1');
    expect(getByTestId('message-statuses').props.children).toBe(
      JSON.stringify({ 'dm-1': 'read' }),
    );
  });
});
