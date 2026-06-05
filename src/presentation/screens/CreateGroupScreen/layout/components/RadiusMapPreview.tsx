import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon } from '@/shared/icons';
import { formatRadiusKm, radiusToRingPx } from './radiusGeometry';

const MAP_WIDTH = 327;
const MAP_HEIGHT = 170;

interface RadiusMapPreviewProps {
  radiusKm: number;
}

export function RadiusMapPreview({ radiusKm }: RadiusMapPreviewProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const cx = MAP_WIDTH / 2;
  const cy = MAP_HEIGHT / 2;
  const ringR = radiusToRingPx(radiusKm, {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  });

  return (
    <View style={styles.frame}>
      <Svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        width="100%"
        height="100%"
      >
        <Rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={colors.surface} />
        {[40, 80, 120, 160].map((y) => (
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={MAP_WIDTH}
            y2={y}
            stroke={colors.line}
            strokeWidth={1}
          />
        ))}
        {[40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
          <Line
            key={`v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={MAP_HEIGHT}
            stroke={colors.line}
            strokeWidth={1}
          />
        ))}
        <Rect x={20} y={20} width={80} height={40} fill={colors.surface2} rx={4} />
        <Rect x={120} y={20} width={60} height={60} fill={colors.surface2} rx={4} />
        <Rect x={200} y={15} width={100} height={50} fill={colors.surface2} rx={4} />
        <Rect x={30} y={100} width={100} height={50} fill={colors.surface2} rx={4} />
        <Rect x={150} y={110} width={80} height={40} fill={colors.surface2} rx={4} />
        <Rect x={240} y={90} width={80} height={60} fill={colors.surface2} rx={4} />
        <Line
          x1={0}
          y1={cy}
          x2={MAP_WIDTH}
          y2={cy}
          stroke={colors.primary}
          strokeWidth={1}
          strokeOpacity={0.18}
          strokeDasharray="2 3"
        />
        <Line
          x1={cx}
          y1={0}
          x2={cx}
          y2={MAP_HEIGHT}
          stroke={colors.primary}
          strokeWidth={1}
          strokeOpacity={0.18}
          strokeDasharray="2 3"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill={colors.primary}
          fillOpacity={0.10}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={ringR}
          stroke={colors.primary}
          strokeWidth={1.4}
          strokeDasharray="3 3"
          strokeOpacity={0.85}
          fill="none"
        />
        <Circle cx={cx} cy={cy} r={34} fill={colors.secondary} fillOpacity={0.18} />
        <Circle cx={cx} cy={cy} r={20} fill={colors.secondary} fillOpacity={0.32} />
        <Circle cx={cx} cy={cy} r={9} fill={colors.secondary} />
        <Circle cx={cx} cy={cy} r={3} fill={colors.background} />
      </Svg>

      <View style={styles.badge} testID="radius-badge">
        <Icon name="radar" size={11} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.badgeText}>{formatRadiusKm(radiusKm).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: MAP_WIDTH / MAP_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceOverlay,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
});
