import type { AnchorType } from '@localloop/shared-types';
import type { NearbyGroupRowData } from '@/shared/ui/nearbyGroup';

/**
 * A group marker on the map. Uses the same data shape as the Home discovery
 * list (`NearbyGroup` + optional `liveCount`) so the selected-pin card can
 * reuse `NearbyGroupRow`. `x`/`y` are fractions (0..1) of the map viewport so
 * pins scale across screen sizes — static placeholders until a real map
 * provider supplies geo-projected positions.
 */
export type MapPinData = NearbyGroupRowData & {
  x: number;
  y: number;
};

export type AnchorFilter = AnchorType | 'all';
