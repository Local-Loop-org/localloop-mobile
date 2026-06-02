import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '@/shared/theme';
import { useRadiusSlider } from '@/shared/ui/radius';

const MIN_KM = 0.2;
const MAX_KM = 25;
const STEP_KM = 0.1;
const TRACK_HEIGHT = 6;
const THUMB_SIZE = 18;

const TICKS = [0.2, 1, 2, 5, 10, 25];

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatTick(value: number): string {
  if (value < 1) return `${Math.round(value * 1000)}m`;
  return `${value}km`;
}

export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  const { onTrackLayout, panHandlers, displayValue, fillPct, trackWidth } =
    useRadiusSlider({
      value,
      min: MIN_KM,
      max: MAX_KM,
      step: STEP_KM,
      onChange,
    });

  const filledWidth = trackWidth * fillPct;
  const thumbX = filledWidth - THUMB_SIZE / 2;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityValue={{ min: MIN_KM, max: MAX_KM, now: displayValue }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          onChange(clamp(value + STEP_KM, MIN_KM, MAX_KM));
        } else if (event.nativeEvent.actionName === 'decrement') {
          onChange(clamp(value - STEP_KM, MIN_KM, MAX_KM));
        }
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    >
      <View style={styles.trackArea} onLayout={onTrackLayout} {...panHandlers}>
        <View style={styles.track} pointerEvents="none" />
        {trackWidth > 0 ? (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: filledWidth }]}
            pointerEvents="none"
          />
        ) : null}
        {trackWidth > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              { left: clamp(thumbX, 0, trackWidth - THUMB_SIZE) },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.ticks}>
        {TICKS.map((tick) => {
          const active = Math.abs(displayValue - tick) < STEP_KM / 2;
          return (
            <Pressable
              key={tick}
              onPress={() => onChange(tick)}
              testID={`radius-tick-${tick}`}
              accessibilityRole="button"
              accessibilityLabel={formatTick(tick)}
              hitSlop={8}
            >
              <Text style={[styles.tickText, active ? styles.tickTextActive : null]}>
                {formatTick(tick)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackArea: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: colors.surface2,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    top: (28 - TRACK_HEIGHT) / 2,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: (28 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.text,
    borderColor: colors.background,
    borderWidth: 3,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  tickText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
  },
  tickTextActive: {
    color: colors.primary,
  },
});
