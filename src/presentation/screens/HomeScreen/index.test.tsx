import React from 'react';
import { Alert } from 'react-native';
import {
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { AnchorType, GroupPrivacy, MemberRole, MemberStatus } from '@localloop/shared-types';
import HomeScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    getNearbyGroups: jest.fn(),
    getMyGroups: jest.fn(),
    joinGroup: jest.fn(),
  },
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
const mockedJoin = groupsApi.joinGroup as jest.MockedFunction<
  typeof groupsApi.joinGroup
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
  distanceMeters: 210,
  privacy: GroupPrivacy.OPEN,
  memberCount: 5,
  radiusKm: 25,
  myRole: null,
  memberStatus: null,
};

const sampleEstablishment = {
  id: 'g-2',
  name: 'Pedalada do Sábado',
  description: null,
  anchorType: AnchorType.ESTABLISHMENT,
  anchorLabel: 'Café Manfredini',
  distanceMeters: 30,
  privacy: GroupPrivacy.OPEN,
  memberCount: 18,
  radiusKm: 25,
  myRole: null,
  memberStatus: null,
};

const sampleEvent = {
  id: 'g-3',
  name: 'Festival de Inverno',
  description: null,
  anchorType: AnchorType.EVENT,
  anchorLabel: 'Largo da Ordem',
  distanceMeters: 1234,
  privacy: GroupPrivacy.OPEN,
  memberCount: 128,
  radiusKm: 25,
  myRole: null,
  memberStatus: null,
};

const samplePrivateNeighborhood = {
  id: 'g-4',
  name: 'Condomínio Vista Verde',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Vila Madalena',
  distanceMeters: 80,
  privacy: GroupPrivacy.APPROVAL_REQUIRED,
  memberCount: 42,
  radiusKm: 25,
  myRole: null,
  memberStatus: null,
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
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockedGetPosition.mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    mockedGetNearby.mockResolvedValue([
      sampleNeighborhood,
      sampleEstablishment,
      sampleEvent,
    ]);
    mockedGetMyGroups.mockResolvedValue({ data: [], next_cursor: null });
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

  it('shows an error message and no groups when location is denied', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'denied' });

    const { findByText, queryByText } = renderScreen();

    expect(
      await findByText(
        'Precisamos da sua localização para mostrar grupos próximos.',
      ),
    ).toBeTruthy();
    expect(queryByText('Morumbi Runners')).toBeNull();
    expect(mockedGetNearby).not.toHaveBeenCalled();
  });

  it('shows an error message when getNearbyGroups throws', async () => {
    mockedGetNearby.mockRejectedValueOnce(new Error('boom'));

    const { findByText } = renderScreen();

    expect(
      await findByText('Não foi possível carregar os grupos. Tente novamente.'),
    ).toBeTruthy();
  });

  it('OPEN card press: fires joinGroup and navigates to GroupChat with myRole=MEMBER', async () => {
    mockedJoin.mockResolvedValueOnce({
      status: 'joined',
      role: MemberRole.MEMBER,
    });
    const { findByText } = renderScreen();
    const card = await findByText('Morumbi Runners');

    fireEvent.press(card);

    await waitFor(() => expect(mockedJoin).toHaveBeenCalledWith('g-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'g-1',
      groupName: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.MEMBER,
    });
  });

  it('OPEN card press still navigates when joinGroup rejects with 409 ALREADY_MEMBER', async () => {
    mockedJoin.mockRejectedValueOnce({ response: { status: 409 } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByText } = renderScreen();
    const card = await findByText('Morumbi Runners');

    fireEvent.press(card);

    await waitFor(() => expect(mockedJoin).toHaveBeenCalledWith('g-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'g-1',
      groupName: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.MEMBER,
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('APPROVAL_REQUIRED card press: shows confirm modal but does not call joinGroup or navigate yet', async () => {
    mockedGetNearby.mockResolvedValueOnce([samplePrivateNeighborhood]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByText } = renderScreen();
    const card = await findByText('Condomínio Vista Verde');

    fireEvent.press(card);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Solicitar entrada?');
    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('APPROVAL_REQUIRED confirm: calls joinGroup, shows "Solicitação enviada", does not navigate', async () => {
    mockedGetNearby.mockResolvedValueOnce([samplePrivateNeighborhood]);
    mockedJoin.mockResolvedValueOnce({ status: 'pending' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Condomínio Vista Verde'));

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void | Promise<void>;
    }>;
    const solicitar = buttons.find((b) => b.text === 'Solicitar')!;
    await solicitar.onPress!();

    expect(mockedJoin).toHaveBeenCalledWith('g-4');
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy.mock.calls[1][0]).toBe('Solicitação enviada');
    expect(navigation.navigate).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('APPROVAL_REQUIRED cancel: does not call joinGroup or navigate', async () => {
    mockedGetNearby.mockResolvedValueOnce([samplePrivateNeighborhood]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Condomínio Vista Verde'));

    // Cancel button has no onPress in production; just don't invoke any.
    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('debounces double-taps: only one joinGroup call while mutation is pending', async () => {
    mockedJoin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 'joined', role: MemberRole.MEMBER }), 100),
        ),
    );
    const { findByText } = renderScreen();
    const card = await findByText('Morumbi Runners');

    fireEvent.press(card);
    await waitFor(() => expect(mockedJoin).toHaveBeenCalledTimes(1));
    fireEvent.press(card);
    fireEvent.press(card);

    expect(mockedJoin).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(1));
  });

  it('renders "Meus grupos" section with group rows when data is available', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-29T13:00:00.000Z'));
    try {
      mockedGetMyGroups.mockResolvedValueOnce({
        data: [sampleMyGroup],
        next_cursor: null,
      });
      const { findByText } = renderScreen();

      expect(await findByText('Meus grupos')).toBeTruthy();
      expect(await findByText('Clube dos Corredores')).toBeTruthy();
      expect(await findByText('Bob: Bora amanhã cedo?')).toBeTruthy();
      // lastActivity renders against the locked clock (5h ago).
      expect(await findByText('5h')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
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

  it('navigates to MyGroups when "Ver todos" is pressed in Meus grupos section', async () => {
    mockedGetMyGroups.mockResolvedValueOnce({
      data: [sampleMyGroup],
      next_cursor: null,
    });
    const { findByText } = renderScreen();
    await findByText('Clube dos Corredores');

    fireEvent.press(await findByText('Ver todos →'));

    expect(navigation.navigate).toHaveBeenCalledWith('MyGroups');
  });

  // --- membership status handler tests ---

  it('ACTIVE member card press: navigates to GroupChat with real myRole, does not call joinGroup', async () => {
    const activeGroup = {
      ...sampleNeighborhood,
      myRole: MemberRole.OWNER,
      memberStatus: MemberStatus.ACTIVE,
    };
    mockedGetNearby.mockResolvedValueOnce([activeGroup]);
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Morumbi Runners'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'g-1',
      groupName: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.OWNER,
    });
  });

  it('PENDING member card press: does not call joinGroup or navigate', async () => {
    const pendingGroup = { ...sampleNeighborhood, memberStatus: MemberStatus.PENDING };
    mockedGetNearby.mockResolvedValueOnce([pendingGroup]);
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Morumbi Runners'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  // --- badge text tests ---

  it('shows "Entrar" badge for an OPEN non-member group', async () => {
    mockedGetNearby.mockResolvedValueOnce([sampleNeighborhood]);
    const { findByText } = renderScreen();
    await findByText('Morumbi Runners');
    expect(await findByText('Entrar')).toBeTruthy();
  });

  it('shows "Solicitar" badge for an APPROVAL_REQUIRED non-member group', async () => {
    mockedGetNearby.mockResolvedValueOnce([samplePrivateNeighborhood]);
    const { findByText } = renderScreen();
    await findByText('Condomínio Vista Verde');
    expect(await findByText('Solicitar')).toBeTruthy();
  });

  it('shows "Conversar" badge when memberStatus is ACTIVE', async () => {
    const activeGroup = {
      ...sampleNeighborhood,
      myRole: MemberRole.MEMBER,
      memberStatus: MemberStatus.ACTIVE,
    };
    mockedGetNearby.mockResolvedValueOnce([activeGroup]);
    const { findByText } = renderScreen();
    await findByText('Morumbi Runners');
    expect(await findByText('Conversar')).toBeTruthy();
  });

  it('shows "Aguardando" badge when memberStatus is PENDING', async () => {
    const pendingGroup = { ...sampleNeighborhood, memberStatus: MemberStatus.PENDING };
    mockedGetNearby.mockResolvedValueOnce([pendingGroup]);
    const { findByText } = renderScreen();
    await findByText('Morumbi Runners');
    expect(await findByText('Aguardando')).toBeTruthy();
  });
});
