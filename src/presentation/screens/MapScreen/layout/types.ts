import type { AnchorFilter, MapPinData } from '../types';

export interface MapLayoutProps {
  pins: MapPinData[];
  filter: AnchorFilter;
  selectedId: string | null;
  radiusKm: number;
  search: string;
  topInset: number;
  bottomInset: number;
  onChangeFilter: (filter: AnchorFilter) => void;
  onSelectPin: (id: string) => void;
  onChangeRadius: (km: number) => void;
  onChangeSearch: (text: string) => void;
  onRecenter: () => void;
  onCreate: () => void;
  onMyGroups: () => void;
  /** Tapping the selected-pin card. TODO(wire): join + navigate. Optional until wired. */
  onPressGroup?: (id: string) => void;
}
