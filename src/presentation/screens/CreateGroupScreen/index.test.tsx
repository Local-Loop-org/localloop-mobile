import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import CreateGroupScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    createGroup: jest.fn(),
  },
}));

const mockedCreateGroup = groupsApi.createGroup as jest.MockedFunction<
  typeof groupsApi.createGroup
>;
const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const navigation = {
  replace: jest.fn(),
  goBack: jest.fn(),
} as unknown as Parameters<typeof CreateGroupScreen>[0]['navigation'];

const route = { key: 'CreateGroup', name: 'CreateGroup' as const, params: undefined };

const renderScreen = () =>
  render(
    <CreateGroupScreen
      navigation={navigation}
      route={route as never}
    />,
  );

describe('CreateGroupScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('blocks submit and alerts when name is whitespace-only', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Ex: Corredores do Ibirapuera'),
      '   ',
    );
    fireEvent.press(getByText('Criar grupo'));

    expect(alertSpy).toHaveBeenCalledWith('Ops', 'Informe o nome do grupo.');
    expect(mockedCreateGroup).not.toHaveBeenCalled();
  });

  it('blocks submit and alerts when anchorLabel is whitespace-only', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Ex: Corredores do Ibirapuera'),
      'Morumbi Runners',
    );
    fireEvent.changeText(
      getByPlaceholderText('Ex: Parque Ibirapuera'),
      '   ',
    );
    fireEvent.press(getByText('Criar grupo'));

    expect(alertSpy).toHaveBeenCalledWith('Ops', 'Informe o nome da âncora.');
    expect(mockedCreateGroup).not.toHaveBeenCalled();
  });

  it('blocks submit and alerts when location has not been granted', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Ex: Corredores do Ibirapuera'),
      'Morumbi Runners',
    );
    fireEvent.changeText(
      getByPlaceholderText('Ex: Parque Ibirapuera'),
      'Morumbi',
    );
    fireEvent.press(getByText('Criar grupo'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Ops',
      'Capture sua localização antes de criar o grupo.',
    );
    expect(mockedCreateGroup).not.toHaveBeenCalled();
  });

  it('alerts when location permission is denied', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
    const { getByText } = renderScreen();

    await act(async () => {
      fireEvent.press(getByText('Capturar minha localização 📍'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Localização',
      'Precisamos da sua localização para ancorar o grupo.',
    );
  });

  it('submits trimmed payload with description=undefined when empty and navigates on success', async () => {
    mockedCreateGroup.mockResolvedValueOnce({
      id: 'g-new',
      name: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      privacy: GroupPrivacy.OPEN,
      memberCount: 1,
      myRole: MemberRole.OWNER,
    });

    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Ex: Corredores do Ibirapuera'),
      '  Morumbi Runners  ',
    );
    fireEvent.changeText(
      getByPlaceholderText('Ex: Parque Ibirapuera'),
      '  Morumbi  ',
    );
    // Switch anchor type to NEIGHBORHOOD to exercise onAnchorTypeChange
    fireEvent.press(getByText('Bairro'));

    await act(async () => {
      fireEvent.press(getByText('Capturar minha localização 📍'));
    });
    await waitFor(() =>
      expect(getByText('Localização capturada ✅')).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText('Criar grupo'));
    });

    expect(mockedCreateGroup).toHaveBeenCalledWith({
      name: 'Morumbi Runners',
      description: undefined,
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      lat: -23.55,
      lng: -46.63,
      privacy: GroupPrivacy.OPEN,
    });
    expect(navigation.replace).toHaveBeenCalledWith('GroupDetail', {
      groupId: 'g-new',
    });
  });

  it('alerts and does not navigate when createGroup throws', async () => {
    mockedCreateGroup.mockRejectedValueOnce(new Error('network'));

    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(
      getByPlaceholderText('Ex: Corredores do Ibirapuera'),
      'Morumbi Runners',
    );
    fireEvent.changeText(
      getByPlaceholderText('Ex: Parque Ibirapuera'),
      'Morumbi',
    );
    await act(async () => {
      fireEvent.press(getByText('Capturar minha localização 📍'));
    });
    await waitFor(() =>
      expect(getByText('Localização capturada ✅')).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText('Criar grupo'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível criar o grupo. Tente novamente.',
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
