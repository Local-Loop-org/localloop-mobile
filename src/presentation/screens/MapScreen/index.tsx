import React, { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { StackRoutes, TabRoutes } from '@/presentation/navigation/routes';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import MapLayout from './layout';
import type { AnchorFilter, MapPinData } from './types';

/**
 * Static placeholder pins, shaped like the API's `NearbyGroup` (so the
 * selected-pin card reuses `NearbyGroupRow`). `x`/`y` are fractions of the
 * map viewport. TODO(wire): replace with `useNearbyGroups` + live presence +
 * geo-projected positions once a real map provider is integrated — see plan.
 */
const MOCK_PINS: MapPinData[] = [
  {
    id: 'agua-verde',
    name: 'Água verde',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 0,
    privacy: GroupPrivacy.OPEN,
    memberCount: 12,
    myRole: null,
    memberStatus: null,
    liveCount: 4,
    x: 0.39,
    y: 0.37,
  },
  {
    id: 'baggio',
    name: 'Baggio',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 80,
    privacy: GroupPrivacy.OPEN,
    memberCount: 7,
    myRole: null,
    memberStatus: null,
    liveCount: 1,
    x: 0.595,
    y: 0.318,
  },
  {
    id: 'ibira',
    name: 'Lago Ibirá',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 120,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    memberCount: 24,
    myRole: null,
    memberStatus: null,
    liveCount: 9,
    x: 0.687,
    y: 0.488,
  },
  {
    id: 'manfredini',
    name: 'Café Manfredini',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 210,
    privacy: GroupPrivacy.OPEN,
    memberCount: 18,
    myRole: null,
    memberStatus: null,
    liveCount: 5,
    x: 0.246,
    y: 0.46,
  },
  {
    id: 'condo',
    name: 'Ed. Solar',
    description: null,
    anchorType: AnchorType.CONDO,
    anchorLabel: 'Condomínio',
    distanceMeters: 0,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    memberCount: 58,
    myRole: null,
    memberStatus: null,
    liveCount: 6,
    x: 0.508,
    y: 0.604,
  },
  {
    id: 'corredores',
    name: 'Corredores',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 340,
    privacy: GroupPrivacy.OPEN,
    memberCount: 41,
    myRole: null,
    memberStatus: null,
    liveCount: 3,
    x: 0.164,
    y: 0.277,
  },
  {
    id: 'evento',
    name: 'Festival Inverno',
    description: null,
    anchorType: AnchorType.EVENT,
    anchorLabel: 'Evento',
    distanceMeters: 900,
    privacy: GroupPrivacy.OPEN,
    memberCount: 128,
    myRole: null,
    memberStatus: null,
    liveCount: 42,
    x: 0.8,
    y: 0.393,
  },
  {
    id: 'hauer',
    name: 'Hauer',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 600,
    privacy: GroupPrivacy.OPEN,
    memberCount: 89,
    myRole: null,
    memberStatus: null,
    liveCount: 7,
    x: 0.836,
    y: 0.578,
  },
  {
    id: 'bar',
    name: 'Bar do Alemão',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 450,
    privacy: GroupPrivacy.OPEN,
    memberCount: 32,
    myRole: null,
    memberStatus: null,
    liveCount: 11,
    x: 0.282,
    y: 0.637,
  },
];

const DEFAULT_RADIUS_KM = 0.5;

export default function MapScreen({ navigation }: HomeTabsScreenProps<'Map'>) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<AnchorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [search, setSearch] = useState('');

  const handleSelectPin = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <MapLayout
      pins={MOCK_PINS}
      filter={filter}
      selectedId={selectedId}
      radiusKm={radiusKm}
      search={search}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onChangeFilter={setFilter}
      onSelectPin={handleSelectPin}
      onChangeRadius={setRadiusKm}
      onChangeSearch={setSearch}
      onRecenter={() => setSelectedId(null)}
      onCreate={() => navigation.navigate(TabRoutes.CreateGroup)}
      onMyGroups={() => navigation.navigate(StackRoutes.MyGroups)}
      // onPressGroup omitted — TODO(wire): join + navigate (reuse HomeScreen logic).
    />
  );
}
