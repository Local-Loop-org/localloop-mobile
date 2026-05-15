import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupsApi, type NearbyGroup } from '@/infra/api/groups.api';
import type { Coords } from '../useCurrentLocation/useCurrentLocation';

const COORD_PRECISION = 3;

/**
 * Keys are coarsened to ~110m so small device-position jitter doesn't
 * blow up the cache or refetch the same group set.
 */
export function nearbyGroupsKey(coords: Coords | null, radiusKm?: number) {
  if (!coords) return ['groups', 'nearby', null] as const;
  const lat = coords.lat.toFixed(COORD_PRECISION);
  const lng = coords.lng.toFixed(COORD_PRECISION);
  return ['groups', 'nearby', `${lat},${lng}`, radiusKm ?? null] as const;
}

/**
 * Fetches groups near the given coords. The query is only enabled when
 * coords are available — callers gate on permission state.
 */
export function useNearbyGroups(
  coords: Coords | null,
  radiusKm?: number,
): UseQueryResult<NearbyGroup[], Error> {
  return useQuery<NearbyGroup[], Error>({
    queryKey: nearbyGroupsKey(coords, radiusKm),
    queryFn: () => {
      if (!coords) throw new Error('coords_required');
      return groupsApi.getNearbyGroups({ ...coords, radiusKm });
    },
    enabled: coords != null,
    staleTime: 30_000,
  });
}
