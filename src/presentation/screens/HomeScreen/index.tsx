import React, { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  GroupPrivacy,
  MemberRole,
  MemberStatus,
} from '@localloop/shared-types';
import {
  type Coords,
  useCurrentLocation,
} from '@/application/hooks/useCurrentLocation';
import { useNearbyGroups } from '@/application/hooks/useNearbyGroups';
import { useMyGroups } from '@/application/hooks/useMyGroups';
import { useJoinGroup } from '@/application/hooks/useJoinGroup';
import { useGroupPresence } from '@/application/hooks/useGroupPresence';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import type { MyGroup, NearbyGroup } from '@/infra/api/groups.api';
import type { HomeTabsScreenProps } from '@/presentation/navigation/types';
import { StackRoutes } from '@/presentation/navigation/routes';
import HomeLayout from './layout';
import type { HomeMyGroup, HomeNearbyGroup } from './types';

type Props = HomeTabsScreenProps<'Home'>;

const LOCATION_DENIED_MESSAGE =
  'Precisamos da sua localização para mostrar grupos próximos.';
const FETCH_FAILED_MESSAGE =
  'Não foi possível carregar os grupos. Tente novamente.';

function canShowPresence(group: NearbyGroup): boolean {
  return (
    group.privacy === GroupPrivacy.OPEN ||
    group.memberStatus === MemberStatus.ACTIVE
  );
}

function withLiveCount<T extends MyGroup | NearbyGroup>(
  group: T,
  liveCount: number,
): T & { liveCount?: number } {
  return liveCount > 0 ? { ...group, liveCount } : group;
}

export default function HomeScreen({ navigation }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [optimisticPending, setOptimisticPending] = useState<Set<string>>(
    new Set(),
  );

  const discoveryRadiusKm = usePreferencesStore((s) => s.discoveryRadiusKm);

  const { request: requestLocation } = useCurrentLocation();
  const query = useNearbyGroups(coords, discoveryRadiusKm);
  const myGroupsQuery = useMyGroups();
  const joinMutation = useJoinGroup();

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
    }, [fetchCoords]),
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

  const effectiveGroups = useMemo(
    () =>
      groups.map((g) =>
        optimisticPending.has(g.id)
          ? { ...g, memberStatus: MemberStatus.PENDING }
          : g,
      ),
    [groups, optimisticPending],
  );

  const presenceGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of myGroups) ids.add(group.id);
    for (const group of effectiveGroups) {
      if (canShowPresence(group)) ids.add(group.id);
    }
    return [...ids];
  }, [effectiveGroups, myGroups]);

  const presenceCounts = useGroupPresence(presenceGroupIds);

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

  const navigateToChat = useCallback(
    (
      id: string,
      groupName: string,
      anchorType: NearbyGroup['anchorType'],
      myRole: NearbyGroup['myRole'],
    ) => {
      navigation.navigate('GroupChat', {
        groupId: id,
        groupName,
        anchorType,
        myRole,
      });
    },
    [navigation],
  );

  const promptJoinRequest = useCallback(
    (id: string, group: NearbyGroup) => {
      Alert.alert(
        'Solicitar entrada?',
        `${group.name} requer aprovação de um moderador para participar. Deseja enviar uma solicitação?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Solicitar',
            onPress: async () => {
              setOptimisticPending((prev) => new Set([...prev, id]));
              try {
                await joinMutation.mutateAsync({ groupId: id, group });
                Alert.alert(
                  'Solicitação enviada',
                  'Aguarde a aprovação de um moderador para entrar no grupo.',
                );
              } catch {
                setOptimisticPending((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
                Alert.alert(
                  'Erro',
                  'Não foi possível enviar sua solicitação. Tente novamente.',
                );
              }
            },
          },
        ],
      );
    },
    [joinMutation],
  );

  const handlePressGroup = useCallback(
    (id: string) => {
      const group = effectiveGroups.find((g) => g.id === id);
      if (!group) return;

      if (group.memberStatus === MemberStatus.PENDING) return;

      if (joinMutation.isPending) return;

      if (group.memberStatus === MemberStatus.ACTIVE) {
        navigateToChat(id, group.name, group.anchorType, group.myRole);
        return;
      }

      if (group.privacy === GroupPrivacy.OPEN) {
        joinMutation.mutate({ groupId: id, group });
        navigateToChat(id, group.name, group.anchorType, MemberRole.MEMBER);
        return;
      }

      promptJoinRequest(id, group);
    },
    [effectiveGroups, joinMutation, navigateToChat, promptJoinRequest],
  );

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
