import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type NearbyGroup } from '@/infra/api/groups.api';
import { userApi } from '@/infra/api/user.api';
import type { Coords } from './useCurrentLocation';

const COORD_PRECISION = 3;

/**
 * Keys are coarsened to ~110m so small device-position jitter doesn't
 * blow up the cache or refetch the same group set.
 */
export function nearbyGroupsKey(coords: Coords | null) {
  if (!coords) return ['groups', 'nearby', null] as const;
  const lat = coords.lat.toFixed(COORD_PRECISION);
  const lng = coords.lng.toFixed(COORD_PRECISION);
  return ['groups', 'nearby', `${lat},${lng}`] as const;
}

/**
 * Fetches groups near the given coords. Refreshes the server-side geohash
 * before querying so results match the latest position. The query is only
 * enabled when coords are available — callers gate on permission state.
 */
export function useNearbyGroups(
  coords: Coords | null,
): UseQueryResult<NearbyGroup[], Error> {
  return useQuery<NearbyGroup[], Error>({
    queryKey: nearbyGroupsKey(coords),
    queryFn: async () => {
      if (!coords) throw new Error('coords_required');
      await userApi.updateLocation(coords);
      return groupsApi.getNearbyGroups(coords);
    },
    enabled: coords != null,
    staleTime: 30_000,
  });
}
