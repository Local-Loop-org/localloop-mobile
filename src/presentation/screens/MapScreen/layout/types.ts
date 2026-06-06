import type { Coords } from '@/application/hooks/useCurrentLocation/useCurrentLocation';
import type { AnchorFilter, MapPinData } from '../types';

export interface MapLayoutProps {
  pins: MapPinData[];
  filter: AnchorFilter;
  selectedId: string | null;
  radiusKm: number;
  search: string;
  topInset: number;
  bottomInset: number;
  /** Device location for centering the map + drawing the radius. `null` until resolved. */
  userCoords: Coords | null;
  /** Bumped on recenter (compass) press to re-frame the map on the user. */
  recenterTick: number;
  onChangeFilter: (filter: AnchorFilter) => void;
  onSelectPin: (id: string) => void;
  /** Commit-on-release of the radius slider (persists to the shared preference). */
  onCommitRadius: (km: number) => void;
  onChangeSearch: (text: string) => void;
  onRecenter: () => void;
  onCreate: () => void;
  onMyGroups: () => void;
  /** Tapping the selected-pin card → join/navigate flow. */
  onPressGroup?: (id: string) => void;
}
