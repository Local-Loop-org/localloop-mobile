import React, { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { StackRoutes, TabRoutes } from '@/presentation/navigation/routes';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import MapLayout from './layout';
import type { AnchorFilter, MapPinData } from './types';

/**
 * Static placeholder pins (coordinates as fractions of the map viewport).
 * TODO(wire): replace with `useNearbyGroups` + live presence + geo-projected
 * positions once a real map provider is integrated — see plan.
 */
const MOCK_PINS: MapPinData[] = [
  {
    id: 'agua-verde',
    name: 'Água verde',
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceLabel: 'aqui',
    memberCount: 12,
    liveCount: 4,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Caminhada às 18h?',
    x: 0.39,
    y: 0.37,
  },
  {
    id: 'baggio',
    name: 'Baggio',
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceLabel: '80m',
    memberCount: 7,
    liveCount: 1,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Padaria da esquina',
    x: 0.595,
    y: 0.318,
  },
  {
    id: 'ibira',
    name: 'Lago Ibirá',
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceLabel: '120m',
    memberCount: 24,
    liveCount: 9,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    lastMessage: 'Pedala amanhã 7h',
    x: 0.687,
    y: 0.488,
  },
  {
    id: 'manfredini',
    name: 'Café Manfredini',
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceLabel: '210m',
    memberCount: 18,
    liveCount: 5,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Tem mesa livre?',
    x: 0.246,
    y: 0.46,
  },
  {
    id: 'condo',
    name: 'Ed. Solar',
    anchorType: AnchorType.CONDO,
    anchorLabel: 'Condomínio',
    distanceLabel: '0m',
    memberCount: 58,
    liveCount: 6,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    lastMessage: 'Entrega na portaria',
    x: 0.508,
    y: 0.604,
  },
  {
    id: 'corredores',
    name: 'Corredores',
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceLabel: '340m',
    memberCount: 41,
    liveCount: 3,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Treino cancelado',
    x: 0.164,
    y: 0.277,
  },
  {
    id: 'evento',
    name: 'Festival Inverno',
    anchorType: AnchorType.EVENT,
    anchorLabel: 'Evento',
    distanceLabel: '900m',
    memberCount: 128,
    liveCount: 42,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Começa em 20min!',
    x: 0.8,
    y: 0.393,
  },
  {
    id: 'hauer',
    name: 'Hauer',
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceLabel: '600m',
    memberCount: 89,
    liveCount: 7,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Feira amanhã',
    x: 0.836,
    y: 0.578,
  },
  {
    id: 'bar',
    name: 'Bar do Alemão',
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceLabel: '450m',
    memberCount: 32,
    liveCount: 11,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Happy hour rolando',
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
      // onPressJoin omitted — TODO(wire): join + navigate (reuse HomeScreen logic).
    />
  );
}
