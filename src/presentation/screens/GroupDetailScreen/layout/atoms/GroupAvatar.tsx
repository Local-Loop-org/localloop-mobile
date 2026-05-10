import React from 'react';
import { AnchorType } from '@localloop/shared-types';
import { AnchorIconBadge } from '@/shared/icons';

interface GroupAvatarProps {
  anchorType: AnchorType;
  size?: number;
}

/**
 * Default group "image" — same anchor-type icon and soft gradient surface as
 * DiscoverCard / MyGroupRow / DiscoverRow on Home, so the visual language stays
 * consistent across screens. A real per-group photo override comes later.
 */
export function GroupAvatar({ anchorType, size = 64 }: GroupAvatarProps) {
  return (
    <AnchorIconBadge
      anchorType={anchorType}
      size={size}
      iconSize={Math.round(size * 0.45)}
      borderRadius={Math.round(size * 0.28)}
    />
  );
}
