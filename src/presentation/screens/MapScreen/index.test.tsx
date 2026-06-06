import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import MapScreen from './index';
import { groupsApi } from '@/infra/api/groups.api';
import { useGroupListRealtime } from '@/application/hooks/useGroupListRealtime/useGroupListRealtime';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: {
    getNearbyGroups: jest.fn(),
    joinGroup: jest.fn(),
  },
}));

jest.mock(
  '@/application/hooks/useGroupListRealtime/useGroupListRealtime',
  () => ({
    useGroupListRealtime: jest.fn(),
  }),
);

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockedGetNearby = groupsApi.getNearbyGroups as jest.MockedFunction<
  typeof groupsApi.getNearbyGroups
>;
const mockedJoin = groupsApi.joinGroup as jest.MockedFunction<
  typeof groupsApi.joinGroup
>;
const mockedUseGroupListRealtime = useGroupListRealtime as jest.MockedFunction<
  typeof useGroupListRealtime
>;

const navigation = {
  navigate: jest.fn(),
} as unknown as Parameters<typeof MapScreen>[0]['navigation'];

const route = { key: 'Map', name: 'Map' as const, params: undefined };

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderScreen = () =>
  render(<MapScreen navigation={navigation} route={route as never} />, {
    wrapper: makeWrapper(),
  });

const openGroup = {
  id: 'g-1',
  name: 'Praça Central',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Bairro',
  distanceMeters: 120,
  anchorLat: -25.4284,
  anchorLng: -49.2733,
  privacy: GroupPrivacy.OPEN,
  memberCount: 12,
  myRole: null,
  memberStatus: null,
};

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNearby.mockResolvedValue([openGroup]);
    mockedUseGroupListRealtime.mockReturnValue({});
  });

  it('renders a marker per live nearby group from the query', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('map-pin-g-1')).toBeTruthy();
    await waitFor(() => expect(mockedGetNearby).toHaveBeenCalled());
  });

  it('selecting a marker shows its card; pressing an OPEN card joins and navigates', async () => {
    mockedJoin.mockResolvedValueOnce({
      status: 'joined',
      role: MemberRole.MEMBER,
    });
    const { findByTestId, getByLabelText } = renderScreen();

    fireEvent.press(await findByTestId('map-pin-g-1'));

    const card = await waitFor(() => getByLabelText('Abrir Praça Central'));
    fireEvent.press(card);

    expect(navigation.navigate).toHaveBeenCalledWith('GroupChat', {
      groupId: 'g-1',
      groupName: 'Praça Central',
      anchorType: AnchorType.NEIGHBORHOOD,
      myRole: MemberRole.MEMBER,
    });
    await waitFor(() => expect(mockedJoin).toHaveBeenCalledWith('g-1'));
  });

  it('passes only presence-eligible groups to the realtime presence watcher', async () => {
    const { findByTestId } = renderScreen();
    await findByTestId('map-pin-g-1');

    await waitFor(() =>
      expect(mockedUseGroupListRealtime).toHaveBeenLastCalledWith({
        presenceGroupIds: ['g-1'],
        enabled: true,
      }),
    );
  });
});
