import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useArchiveDmConversation } from '@/application/hooks/useArchiveDmConversation/useArchiveDmConversation';
import { useDmChat } from '@/application/hooks/useDmChat/useDmChat';
import { useUnarchiveDmConversation } from '@/application/hooks/useUnarchiveDmConversation/useUnarchiveDmConversation';
import DmChatScreen from './index';
import type { DmChatScreenProps } from './types';

jest.mock('@/application/hooks/useDmChat/useDmChat', () => ({
  useDmChat: jest.fn(),
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
    moreDisabled?: boolean;
    onPressMore: () => void;
  }) {
    return (
      <View>
        <Text testID="more-disabled">{String(!!props.moreDisabled)}</Text>
        <TouchableOpacity testID="header-more" onPress={props.onPressMore}>
          <Text>more</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

const mockedUseDmChat = useDmChat as jest.MockedFunction<typeof useDmChat>;
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
    mockedUseArchiveDmConversation.mockReturnValue({
      mutate: archiveMutate,
      isPending: false,
    } as never);
    mockedUseUnarchiveDmConversation.mockReturnValue({
      mutate: unarchiveMutate,
      isPending: false,
    } as never);
  });

  it('shows an archive action from the header menu', () => {
    const { getByTestId } = renderScreen(false);

    fireEvent.press(getByTestId('header-more'));

    expect(Alert.alert).toHaveBeenCalledWith('Alice', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      expect.objectContaining({ text: 'Arquivar' }),
    ]);

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    act(() => {
      buttons[1].onPress();
    });

    expect(archiveMutate).toHaveBeenCalledWith(
      'peer-1',
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('shows an unarchive action for initially archived conversations', () => {
    const { getByTestId } = renderScreen(true);

    fireEvent.press(getByTestId('header-more'));

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(buttons[1].text).toBe('Desarquivar');
    act(() => {
      buttons[1].onPress();
    });

    expect(unarchiveMutate).toHaveBeenCalledWith(
      'peer-1',
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('shows an error alert when archive fails', () => {
    const { getByTestId } = renderScreen(false);
    fireEvent.press(getByTestId('header-more'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];

    act(() => {
      buttons[1].onPress();
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
});
