import type { AnchorType } from '@localloop/shared-types';
import type { NearbyGroupRowData } from '@/shared/ui/nearbyGroup';

/**
 * A group marker on the map. Same data shape as the Home discovery list
 * (`NearbyGroup` + optional `liveCount`) so the selected-pin card can reuse
 * `NearbyGroupRow`. Position comes from the group's anchor coordinates
 * (`anchorLat`/`anchorLng` on `NearbyGroup`), rendered as a geo `<Marker>`.
 */
export type MapPinData = NearbyGroupRowData;

export type AnchorFilter = AnchorType | 'all';
