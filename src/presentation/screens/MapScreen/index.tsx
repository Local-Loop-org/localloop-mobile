import React, { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { StackRoutes, TabRoutes } from '@/presentation/navigation/routes';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import MapLayout from './layout';
import type { AnchorFilter, MapPinData } from './types';

/**
 * Static placeholder pins, shaped like the API's `NearbyGroup` (so the
 * selected-pin card reuses `NearbyGroupRow`). `anchorLat`/`anchorLng` are real
 * geo coordinates scattered around central Curitiba (the map's fallback
 * center) so they render as `<Marker>`s on the basemap — but they only sit
 * near the user when the user is in Curitiba. TODO(wire): replace with
 * `useNearbyGroups` + live presence (handoff §8), which positions markers at
 * each group's real anchor relative to the actual user location.
 */
const MOCK_PINS: MapPinData[] = [
  {
    id: 'agua-verde',
    name: 'Água verde',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 0,
    anchorLat: -25.4284,
    anchorLng: -49.2733,
    privacy: GroupPrivacy.OPEN,
    memberCount: 12,
    myRole: null,
    memberStatus: null,
    liveCount: 4,
  },
  {
    id: 'baggio',
    name: 'Baggio',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 80,
    anchorLat: -25.429,
    anchorLng: -49.2715,
    privacy: GroupPrivacy.OPEN,
    memberCount: 7,
    myRole: null,
    memberStatus: null,
    liveCount: 1,
  },
  {
    id: 'ibira',
    name: 'Lago Ibirá',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 120,
    anchorLat: -25.4272,
    anchorLng: -49.2748,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    memberCount: 24,
    myRole: null,
    memberStatus: null,
    liveCount: 9,
  },
  {
    id: 'manfredini',
    name: 'Café Manfredini',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 210,
    anchorLat: -25.4301,
    anchorLng: -49.2756,
    privacy: GroupPrivacy.OPEN,
    memberCount: 18,
    myRole: null,
    memberStatus: null,
    liveCount: 5,
  },
  {
    id: 'condo',
    name: 'Ed. Solar',
    description: null,
    anchorType: AnchorType.CONDO,
    anchorLabel: 'Condomínio',
    distanceMeters: 0,
    anchorLat: -25.4268,
    anchorLng: -49.2726,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    memberCount: 58,
    myRole: null,
    memberStatus: null,
    liveCount: 6,
  },
  {
    id: 'corredores',
    name: 'Corredores',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 340,
    anchorLat: -25.4256,
    anchorLng: -49.2762,
    privacy: GroupPrivacy.OPEN,
    memberCount: 41,
    myRole: null,
    memberStatus: null,
    liveCount: 3,
  },
  {
    id: 'evento',
    name: 'Festival Inverno',
    description: null,
    anchorType: AnchorType.EVENT,
    anchorLabel: 'Evento',
    distanceMeters: 900,
    anchorLat: -25.4322,
    anchorLng: -49.2701,
    privacy: GroupPrivacy.OPEN,
    memberCount: 128,
    myRole: null,
    memberStatus: null,
    liveCount: 42,
  },
  {
    id: 'hauer',
    name: 'Hauer',
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 600,
    anchorLat: -25.4247,
    anchorLng: -49.2704,
    privacy: GroupPrivacy.OPEN,
    memberCount: 89,
    myRole: null,
    memberStatus: null,
    liveCount: 7,
  },
  {
    id: 'bar',
    name: 'Bar do Alemão',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 450,
    anchorLat: -25.4308,
    anchorLng: -49.2778,
    privacy: GroupPrivacy.OPEN,
    memberCount: 32,
    myRole: null,
    memberStatus: null,
    liveCount: 11,
  },
];

const DEFAULT_RADIUS_KM = 0.5;

export default function MapScreen({ navigation }: HomeTabsScreenProps<'Map'>) {
  const insets = useSafeAreaInsets();
  const { coords, request } = useCurrentLocation();
  const [filter, setFilter] = useState<AnchorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [search, setSearch] = useState('');
  const [recenterTick, setRecenterTick] = useState(0);

  // Resolve the device location so the basemap can center + draw the radius.
  // Permission is normally already granted (onboarding/Home); this re-reads it.
  useEffect(() => {
    request();
  }, [request]);

  const handleSelectPin = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRecenter = useCallback(() => {
    setSelectedId(null);
    setRecenterTick((tick) => tick + 1);
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
      userCoords={coords}
      recenterTick={recenterTick}
      onChangeFilter={setFilter}
      onSelectPin={handleSelectPin}
      onChangeRadius={setRadiusKm}
      onChangeSearch={setSearch}
      onRecenter={handleRecenter}
      onCreate={() => navigation.navigate(TabRoutes.CreateGroup)}
      onMyGroups={() => navigation.navigate(StackRoutes.MyGroups)}
      // onPressGroup omitted — TODO(wire): join + navigate (reuse HomeScreen logic).
    />
  );
}
