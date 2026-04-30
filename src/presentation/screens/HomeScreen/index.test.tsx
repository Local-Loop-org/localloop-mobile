import React from 'react';
import { Alert } from 'react-native';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import HomeScreen from './index';
import { useAuthStore } from '@/application/stores/auth.store';
import { groupsApi } from '@/infra/api/groups.api';
import { userApi } from '@/infra/api/user.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getNearbyGroups: jest.fn(), getMyGroups: jest.fn() },
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
const mockedGetMyGroups = groupsApi.getMyGroups as jest.MockedFunction<
  typeof groupsApi.getMyGroups
>;
const mockedUpdateLocation = userApi.updateLocation as jest.MockedFunction<
  typeof userApi.updateLocation
>;
const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const navigation = {
  navigate: jest.fn(),
} as unknown as Parameters<typeof HomeScreen>[0]['navigation'];

const route = {
  key: 'Home',
  name: 'Home' as const,
  params: undefined,
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderScreen = () =>
  render(<HomeScreen navigation={navigation} route={route as never} />, {
    wrapper: makeWrapper(),
  });

const sampleNeighborhood = {
  id: 'g-1',
  name: 'Morumbi Runners',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  proximityLabel: 'Mesmo bairro' as const,
  privacy: GroupPrivacy.OPEN,
  memberCount: 5,
};

const sampleEstablishment = {
  id: 'g-2',
  name: 'Pedalada do Sábado',
  description: null,
  anchorType: AnchorType.ESTABLISHMENT,
  anchorLabel: 'Café Manfredini',
  proximityLabel: 'Mesmo local' as const,
  privacy: GroupPrivacy.OPEN,
  memberCount: 18,
};

const sampleEvent = {
  id: 'g-3',
  name: 'Festival de Inverno',
  description: null,
  anchorType: AnchorType.EVENT,
  anchorLabel: 'Largo da Ordem',
  proximityLabel: 'Região próxima' as const,
  privacy: GroupPrivacy.OPEN,
  memberCount: 128,
};

const sampleMyGroup = {
  id: 'mg-1',
  name: 'Clube dos Corredores',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Vila Madalena',
  memberCount: 12,
  myRole: MemberRole.OWNER,
  lastActivityAt: '2026-04-29T08:00:00.000Z',
  lastMessage: {
    content: 'Bora amanhã cedo?',
    senderName: 'Bob',
    createdAt: '2026-04-29T08:00:00.000Z',
  },
};

describe('HomeScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    mockedUpdateLocation.mockResolvedValue(undefined);
    mockedGetNearby.mockResolvedValue([
      sampleNeighborhood,
      sampleEstablishment,
      sampleEvent,
    ]);
    mockedGetMyGroups.mockResolvedValue({ data: [], next_cursor: null });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('useFocusEffect triggers an initial load and renders groups under sections', async () => {
    const { findByText } = renderScreen();

    expect(await findByText('Morumbi Runners')).toBeTruthy();
    expect(await findByText('Pedalada do Sábado')).toBeTruthy();
    expect(await findByText('Festival de Inverno')).toBeTruthy();
    // Section labels render alongside the groups.
    expect(await findByText('Lugares')).toBeTruthy();
    expect(await findByText('Bairros')).toBeTruthy();
    expect(await findByText('Eventos')).toBeTruthy();
    expect(mockedGetNearby).toHaveBeenCalledTimes(1);
  });

  it('hides empty section buckets', async () => {
    mockedGetNearby.mockResolvedValueOnce([sampleNeighborhood]);
    const { findByText, queryByText } = renderScreen();

    await findByText('Morumbi Runners');
    expect(queryByText('Lugares')).toBeNull();
    expect(queryByText('Eventos')).toBeNull();
    expect(queryByText('Prédios')).toBeNull();
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

  it('navigates to GroupChat when a group is pressed', async () => {
    const { findByText } = renderScreen();
    const card = await findByText('Morumbi Runners');

    fireEvent.press(card);

    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'g-1',
      groupName: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: null,
    });
  });

  it('navigates to CreateGroup when the new-group tab is pressed', async () => {
    const { findByText, findByLabelText } = renderScreen();
    await findByText('Morumbi Runners');

    fireEvent.press(await findByLabelText('Novo'));

    expect(navigation.navigate).toHaveBeenCalledWith('CreateGroup');
  });

  it('renders "Meus grupos" section with group rows when data is available', async () => {
    mockedGetMyGroups.mockResolvedValueOnce({
      data: [sampleMyGroup],
      next_cursor: null,
    });
    const { findByText } = renderScreen();

    expect(await findByText('Meus grupos')).toBeTruthy();
    expect(await findByText('Clube dos Corredores')).toBeTruthy();
    expect(await findByText('Bob: Bora amanhã cedo?')).toBeTruthy();
  });

  it('hides "Meus grupos" section when the user has no groups', async () => {
    const { findByText, queryByText } = renderScreen();

    await findByText('Morumbi Runners');
    expect(queryByText('Meus grupos')).toBeNull();
  });

  it('navigates to GroupChat with myRole when a my-groups row is pressed', async () => {
    mockedGetMyGroups.mockResolvedValueOnce({
      data: [sampleMyGroup],
      next_cursor: null,
    });
    const { findByText } = renderScreen();
    const row = await findByText('Clube dos Corredores');

    fireEvent.press(row);

    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'mg-1',
      groupName: 'Clube dos Corredores',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.OWNER,
    });
  });

  it('logs the user out via the header more action sheet', async () => {
    const logoutSpy = jest.fn();
    useAuthStore.setState({ logout: logoutSpy });

    const { findByText, findByLabelText } = renderScreen();
    await findByText('Morumbi Runners');

    fireEvent.press(await findByLabelText('Mais opções'));

    const buttons = alertSpy.mock.calls[0][2];
    const sairBtn = buttons.find(
      (b: { text: string }) => b.text === 'Sair',
    );
    await act(async () => {
      await sairBtn.onPress();
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
