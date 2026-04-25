import { AnchorType } from '@localloop/shared-types';
import type { IconName } from './Icon';

const ANCHOR_ICON: Record<AnchorType, IconName> = {
  [AnchorType.ESTABLISHMENT]: 'coffee',
  [AnchorType.NEIGHBORHOOD]: 'leaf',
  [AnchorType.CONDO]: 'building',
  [AnchorType.EVENT]: 'calendar',
  [AnchorType.CITY]: 'globe',
};

export function anchorIconName(type: AnchorType): IconName {
  return ANCHOR_ICON[type];
}
