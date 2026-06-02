import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/shared/theme';

const BASE_PX = 30;
const SLOPE_PX_PER_KM = 22;
const MAX_FRACTION = 0.34;
const STROKE = 1.5;

interface MapRadiusRingProps {
  radiusKm: number;
}

/**
 * Centered dashed radius ring, sized in real pixels (small, like the design)
 * rather than scaled up with the basemap. Placeholder scale until a real map
 * provider gives true metres-per-pixel.
 */
export function MapRadiusRing({ radiusKm }: MapRadiusRingProps) {
  const { width, height } = useWindowDimensions();
  const cap = Math.min(width, height) * MAX_FRACTION;
  const r = Math.min(BASE_PX + radiusKm * SLOPE_PX_PER_KM, cap || BASE_PX);
  const size = (r + STROKE) * 2;
  const c = size / 2;

  return (
    <View style={styles.center} pointerEvents="none">
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill={colors.primary} fillOpacity={0.06} />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={colors.primary}
          strokeOpacity={0.6}
          strokeWidth={STROKE}
          strokeDasharray="6 5"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
