import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/shared/theme';

const BASE_PX = 30;
const SLOPE_PX_PER_KM = 22;
const STROKE = 1.5;

interface MapRadiusRingProps {
  radiusKm: number;
}

/**
 * Centered dashed radius ring. Sized relative to the map (not the screen), so
 * it grows without bound and may overflow the viewport — it's clipped to the
 * map area and will scale with the map's zoom once a real provider is wired in.
 * `SLOPE_PX_PER_KM` is a placeholder scale until then.
 */
export function MapRadiusRing({ radiusKm }: MapRadiusRingProps) {
  const r = BASE_PX + radiusKm * SLOPE_PX_PER_KM;
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
