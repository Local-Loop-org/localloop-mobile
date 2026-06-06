import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { useNearbyGroups } from '@/application/hooks/useNearbyGroups/useNearbyGroups';
import { useGroupJoinFlow } from '@/application/hooks/useGroupJoinFlow/useGroupJoinFlow';
import { useGroupListRealtime } from '@/application/hooks/useGroupListRealtime/useGroupListRealtime';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import { canShowPresence, withLiveCount } from '@/shared/groups/presence';
import { StackRoutes, TabRoutes } from '@/presentation/navigation/routes';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import MapLayout from './layout';
import type { AnchorFilter, MapPinData } from './types';

export default function MapScreen({ navigation }: HomeTabsScreenProps<'Map'>) {
  const insets = useSafeAreaInsets();
  const { coords, request } = useCurrentLocation();
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState<AnchorFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [recenterTick, setRecenterTick] = useState(0);

  // The discovery radius is shared with Home + Profile via the preferences
  // store, so all three surfaces stay in sync.
  const discoveryRadiusKm = usePreferencesStore((s) => s.discoveryRadiusKm);
  const setDiscoveryRadiusKm = usePreferencesStore(
    (s) => s.setDiscoveryRadiusKm,
  );

  // Resolve the device location so the basemap can center + draw the radius.
  // Permission is normally already granted (onboarding/Home); this re-reads it.
  useEffect(() => {
    request();
  }, [request]);

  // Live nearby groups (auto-disabled while `coords` is null — e.g. permission
  // denied — in which case the map just centers on its fallback with no pins).
  const query = useNearbyGroups(coords, discoveryRadiusKm);
  const groups = query.data ?? [];

  const { effectiveGroups, handlePressGroup } = useGroupJoinFlow({
    groups,
    navigation,
  });

  const presenceGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of effectiveGroups) {
      if (canShowPresence(group)) ids.add(group.id);
    }
    return [...ids];
  }, [effectiveGroups]);

  const presenceCounts = useGroupListRealtime({
    presenceGroupIds,
    enabled: isFocused,
  });

  const pins = useMemo<MapPinData[]>(
    () =>
      effectiveGroups.map((group) =>
        withLiveCount(
          group,
          canShowPresence(group) ? (presenceCounts[group.id] ?? 0) : 0,
        ),
      ),
    [effectiveGroups, presenceCounts],
  );

  const handleSelectPin = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRecenter = useCallback(() => {
    setSelectedId(null);
    setRecenterTick((tick) => tick + 1);
  }, []);

  const handleCommitRadius = useCallback(
    (km: number) => {
      if (km !== discoveryRadiusKm) void setDiscoveryRadiusKm(km);
    },
    [discoveryRadiusKm, setDiscoveryRadiusKm],
  );

  return (
    <MapLayout
      pins={pins}
      filter={filter}
      selectedId={selectedId}
      radiusKm={discoveryRadiusKm}
      search={search}
      topInset={insets.top}
      bottomInset={insets.bottom}
      userCoords={coords}
      recenterTick={recenterTick}
      onChangeFilter={setFilter}
      onSelectPin={handleSelectPin}
      onCommitRadius={handleCommitRadius}
      onChangeSearch={setSearch}
      onRecenter={handleRecenter}
      onCreate={() => navigation.navigate(TabRoutes.CreateGroup)}
      onMyGroups={() => navigation.navigate(StackRoutes.MyGroups)}
      onPressGroup={handlePressGroup}
    />
  );
}
