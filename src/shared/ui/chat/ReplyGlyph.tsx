import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ReplyGlyphProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ReplyGlyph({
  size = 12,
  color = 'currentColor',
  strokeWidth = 1.8,
}: ReplyGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox='0 0 14 14' fill='none'>
      <Path
        d='M5.5 3.5L2 7l3.5 3.5'
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M2 7h6a4 4 0 014 4v.5'
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}
