import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  type Coords,
  useCurrentLocation,
} from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import { useNearbyGroups } from '@/application/hooks/useNearbyGroups/useNearbyGroups';
import { useMyGroups } from '@/application/hooks/useMyGroups/useMyGroups';
import { useGroupJoinFlow } from '@/application/hooks/useGroupJoinFlow/useGroupJoinFlow';
import { useHomePushBootstrap } from '@/application/hooks/usePushNotifications/usePushNotifications';
import { useUserProfile } from '@/application/hooks/useUserProfile/useUserProfile';
import { useGroupListRealtime } from '@/application/hooks/useGroupListRealtime/useGroupListRealtime';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import { canShowPresence, withLiveCount } from '@/shared/groups/presence';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import { StackRoutes } from '@/presentation/navigation/routes';
import HomeLayout from './layout';
import type { HomeMyGroup, HomeNearbyGroup } from './types';

type Props = HomeTabsScreenProps<'Home'>;

const LOCATION_DENIED_MESSAGE =
  'Precisamos da sua localização para mostrar grupos próximos.';
const FETCH_FAILED_MESSAGE =
  'Não foi possível carregar os grupos. Tente novamente.';

export default function HomeScreen({ navigation }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const didFocusOnceRef = useRef(false);

  const discoveryRadiusKm = usePreferencesStore((s) => s.discoveryRadiusKm);

  const { request: requestLocation } = useCurrentLocation();
  const query = useNearbyGroups(coords, discoveryRadiusKm);
  const myGroupsQuery = useMyGroups();
  const profileQuery = useUserProfile();
  const isFocused = useIsFocused();

  useHomePushBootstrap(
    profileQuery.data?.pushPermissionStatus,
    profileQuery.isSuccess,
  );

  const fetchCoords = useCallback(async () => {
    const next = await requestLocation();
    if (!next) {
      setLocationDenied(true);
      setCoords(null);
      return null;
    }
    setLocationDenied(false);
    setCoords(next);
    return next;
  }, [requestLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchCoords();
      if (didFocusOnceRef.current) {
        myGroupsQuery.refetch();
      } else {
        didFocusOnceRef.current = true;
      }
    }, [fetchCoords, myGroupsQuery.refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchCoords();
      if (next) await Promise.all([query.refetch(), myGroupsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCoords, query, myGroupsQuery]);

  const groups = query.data ?? [];
  const myGroups = myGroupsQuery.data ?? [];

  const { effectiveGroups, handlePressGroup } = useGroupJoinFlow({
    groups,
    navigation,
  });

  const myGroupIds = useMemo(() => myGroups.map((g) => g.id), [myGroups]);

  const presenceGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of myGroupIds) ids.add(id);
    for (const group of effectiveGroups) {
      if (canShowPresence(group)) ids.add(group.id);
    }
    return [...ids];
  }, [effectiveGroups, myGroupIds]);

  const presenceCounts = useGroupListRealtime({
    presenceGroupIds,
    summaryGroupIds: myGroupIds,
    enabled: isFocused,
  });

  const groupsWithPresence = useMemo<HomeNearbyGroup[]>(
    () =>
      effectiveGroups.map((group) =>
        withLiveCount(
          group,
          canShowPresence(group) ? (presenceCounts[group.id] ?? 0) : 0,
        ),
      ),
    [effectiveGroups, presenceCounts],
  );

  const myGroupsWithPresence = useMemo<HomeMyGroup[]>(
    () =>
      myGroups.map((group) =>
        withLiveCount(group, presenceCounts[group.id] ?? 0),
      ),
    [myGroups, presenceCounts],
  );

  const errorMessage = locationDenied
    ? LOCATION_DENIED_MESSAGE
    : query.isError
      ? FETCH_FAILED_MESSAGE
      : null;

  return (
    <HomeLayout
      groups={groupsWithPresence}
      loading={query.isLoading && !!coords}
      refreshing={refreshing}
      errorMessage={errorMessage}
      onRefresh={handleRefresh}
      onPressGroup={handlePressGroup}
      myGroups={myGroupsWithPresence}
      myGroupsLoading={myGroupsQuery.isLoading}
      onPressMyGroup={(id) => {
        const group = myGroups.find((g) => g.id === id);
        if (!group) return;
        navigation.navigate(StackRoutes.GroupChat, {
          groupId: id,
          groupName: group.name,
          anchorType: group.anchorType,
          myRole: group.myRole,
        });
      }}
      onPressViewAllMyGroups={() => navigation.navigate(StackRoutes.MyGroups)}
    />
  );
}
