import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import GroupDiscoveryScreen from './index';
import { useAuthStore } from '@/application/stores/auth.store';
import { groupsApi } from '@/infra/api/groups.api';
import { userApi } from '@/infra/api/user.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getNearbyGroups: jest.fn() },
}));

jest.mock('@/infra/api/user.api', () => ({
  userApi: { updateLocation: jest.fn() },
}));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

const mockedGetNearby = groupsApi.getNearbyGroups as jest.MockedFunction<
  typeof groupsApi.getNearbyGroups
>;
const mockedUpdateLocation = userApi.updateLocation as jest.MockedFunction<
  typeof userApi.updateLocation
>;
const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const navigation = {
  navigate: jest.fn(),
} as unknown as Parameters<typeof GroupDiscoveryScreen>[0]['navigation'];

const route = {
  key: 'GroupDiscovery',
  name: 'GroupDiscovery' as const,
  params: undefined,
};

const renderScreen = () =>
  render(<GroupDiscoveryScreen navigation={navigation} route={route as never} />);

const sampleGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  proximityLabel: 'Mesmo bairro' as const,
  privacy: GroupPrivacy.OPEN,
  memberCount: 5,
};

describe('GroupDiscoveryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    mockedUpdateLocation.mockResolvedValue(undefined);
    mockedGetNearby.mockResolvedValue([sampleGroup]);
  });

  it('useFocusEffect triggers an initial load and renders the group', async () => {
    const { findByText } = renderScreen();

    expect(await findByText('Morumbi Runners')).toBeTruthy();
    expect(mockedGetNearby).toHaveBeenCalledTimes(1);
  });

  it('calls updateLocation before getNearbyGroups', async () => {
    renderScreen();
    await waitFor(() => expect(mockedGetNearby).toHaveBeenCalled());

    const updateOrder = mockedUpdateLocation.mock.invocationCallOrder[0];
    const nearbyOrder = mockedGetNearby.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(nearbyOrder);
    expect(mockedUpdateLocation).toHaveBeenCalledWith({
      lat: -23.55,
      lng: -46.63,
    });
  });

  it('shows an error message and no groups when location is denied', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'denied' });

    const { findByText, queryByText } = renderScreen();

    expect(
      await findByText(
        'Precisamos da sua localização para mostrar grupos próximos.',
      ),
    ).toBeTruthy();
    expect(queryByText('Morumbi Runners')).toBeNull();
    expect(mockedUpdateLocation).not.toHaveBeenCalled();
    expect(mockedGetNearby).not.toHaveBeenCalled();
  });

  it('shows an error message when getNearbyGroups throws', async () => {
    mockedGetNearby.mockRejectedValueOnce(new Error('boom'));

    const { findByText } = renderScreen();

    expect(
      await findByText('Não foi possível carregar os grupos. Tente novamente.'),
    ).toBeTruthy();
  });

  it('navigates to GroupDetail when a group card is pressed', async () => {
    const { findByText } = renderScreen();
    const card = await findByText('Morumbi Runners');

    fireEvent.press(card);

    expect(navigation.navigate).toHaveBeenCalledWith('GroupDetail', {
      groupId: 'g-1',
    });
  });

  it('navigates to CreateGroup when the new-group FAB is pressed', async () => {
    const { findByText } = renderScreen();
    await findByText('Morumbi Runners');

    fireEvent.press(await findByText('+ Novo grupo'));

    expect(navigation.navigate).toHaveBeenCalledWith('CreateGroup');
  });

  it('invokes the store logout when the header logout button is pressed', async () => {
    const logoutSpy = jest.fn();
    useAuthStore.setState({ logout: logoutSpy });

    const { findByText } = renderScreen();
    await findByText('Morumbi Runners');

    await act(async () => {
      fireEvent.press(await findByText('Sair'));
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
