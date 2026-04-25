import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/application/stores/auth.store';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation';
import { groupsApi, type NearbyGroup } from '@/infra/api/groups.api';
import { userApi } from '@/infra/api/user.api';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import GroupDiscoveryLayout from './layout';

type Props = AuthenticatedStackScreenProps<'GroupDiscovery'>;

export default function GroupDiscoveryScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<NearbyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logout = useAuthStore((s) => s.logout);
  const { request: requestLocation } = useCurrentLocation();

  const loadGroups = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setErrorMessage(null);

      try {
        const coords = await requestLocation();
        if (!coords) {
          setErrorMessage(
            'Precisamos da sua localização para mostrar grupos próximos.',
          );
          setGroups([]);
          return;
        }

        // Refresh the server-side geohash before querying nearby groups.
        // Intentionally fire-and-await sequentially so the nearby query
        // sees the most recent geohash for this user.
        await userApi.updateLocation(coords);
        const data = await groupsApi.getNearbyGroups(coords);
        setGroups(data);
      } catch {
        setErrorMessage('Não foi possível carregar os grupos. Tente novamente.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestLocation],
  );

  useFocusEffect(
    useCallback(() => {
      loadGroups('initial');
    }, [loadGroups]),
  );

  return (
    <GroupDiscoveryLayout
      groups={groups}
      loading={loading}
      refreshing={refreshing}
      errorMessage={errorMessage}
      onRefresh={() => loadGroups('refresh')}
      onPressGroup={(id) => {
        const group = groups.find((g) => g.id === id);
        if (!group) return;
        navigation.navigate('GroupChat', {
          groupId: id,
          groupName: group.name,
          anchorType: group.anchorType,
          myRole: null,
        });
      }}
      onPressCreate={() => navigation.navigate('CreateGroup')}
      onLogout={logout}
    />
  );
}
