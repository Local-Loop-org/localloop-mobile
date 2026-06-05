import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatRadiusKm, useRadiusSlider } from '@/shared/ui/radius';

const MIN_KM = 0.2;
const MAX_KM = 25;
const STEP_KM = 0.1;
const TRACK_HEIGHT = 3;
const THUMB_SIZE = 14;

interface MapRadiusControlProps {
  value: number;
  onChange: (value: number) => void;
}

export function MapRadiusControl({ value, onChange }: MapRadiusControlProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { onTrackLayout, panHandlers, displayValue, fillPct, trackWidth } =
    useRadiusSlider({
      value,
      min: MIN_KM,
      max: MAX_KM,
      step: STEP_KM,
      onChange,
    });

  const thumbLeft = trackWidth * fillPct - THUMB_SIZE / 2;

  return (
    <View style={styles.pill}>
      <Icon name="radar" size={13} color={colors.primary} strokeWidth={2} />
      <View
        style={styles.trackArea}
        onLayout={onTrackLayout}
        accessibilityRole="adjustable"
        accessibilityLabel="Raio de busca"
        accessibilityValue={{ text: formatRadiusKm(displayValue) }}
        {...panHandlers}
      >
        <View style={styles.track} pointerEvents="none" />
        {trackWidth > 0 ? (
          <View
            style={[styles.fill, { width: trackWidth * fillPct }]}
            pointerEvents="none"
          />
        ) : null}
        {trackWidth > 0 ? (
          <View
            style={[
              styles.thumb,
              { left: Math.max(0, Math.min(thumbLeft, trackWidth - THUMB_SIZE)) },
            ]}
            pointerEvents="none"
          />
        ) : null}
      </View>
      <Text style={styles.value}>{formatRadiusKm(displayValue)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    trackArea: {
      flex: 1,
      height: 18,
      justifyContent: 'center',
      position: 'relative',
    },
    track: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.surface2,
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: (18 - TRACK_HEIGHT) / 2,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.primary,
    },
    thumb: {
      position: 'absolute',
      top: (18 - THUMB_SIZE) / 2,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    value: {
      fontFamily: fonts.mono,
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
      minWidth: 48,
      textAlign: 'right',
    },
  });
