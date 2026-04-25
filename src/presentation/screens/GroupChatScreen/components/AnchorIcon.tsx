import React from 'react';
import { View } from 'react-native';
import { AnchorType } from '@localloop/shared-types';
import { Icon, anchorIconName } from '@/shared/icons';
import { colors } from '@/shared/theme';

interface AnchorIconProps {
  type: AnchorType;
  size: number;
}

export default function AnchorIcon({ type, size }: AnchorIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        backgroundColor: `${colors.primary}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={anchorIconName(type)} size={17} color={colors.primary} strokeWidth={2} />
    </View>
  );
}
