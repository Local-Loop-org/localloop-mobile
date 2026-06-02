import type { AnchorType, GroupPrivacy } from '@localloop/shared-types';

/**
 * A group marker rendered on the map. `x`/`y` are fractions (0..1) of the
 * map viewport so pins scale across screen sizes. Until a real map provider
 * is wired in, these are static placeholder coordinates (see `MOCK_PINS`).
 */
export interface MapPinData {
  id: string;
  name: string;
  anchorType: AnchorType;
  /** PT category label, e.g. "Bairro". */
  anchorLabel: string;
  /** Pre-formatted distance, e.g. "120m" / "aqui". */
  distanceLabel: string;
  memberCount: number;
  liveCount: number;
  privacy: GroupPrivacy;
  lastMessage: string;
  x: number;
  y: number;
}

export type AnchorFilter = AnchorType | 'all';
