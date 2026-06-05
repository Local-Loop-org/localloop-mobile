import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

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

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatTick(value: number): string {
  if (value < 1) return `${Math.round(value * 1000)}m`;
  return `${value}km`;
}

export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const xToValue = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const t = clamp(x / w, 0, 1);
    const raw = MIN_KM + t * (MAX_KM - MIN_KM);
    return clamp(quantize(raw, STEP_KM), MIN_KM, MAX_KM);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          onChangeRef.current(xToValue(e.nativeEvent.locationX));
        },
        onPanResponderMove: (_, gesture) => {
          // gesture.moveX is screen-relative; subtract the track's measured
          // page-x to get the finger position inside the track.
          const fingerX = gesture.moveX - trackOriginRef.current;
          onChangeRef.current(xToValue(fingerX));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Track screen-x origin so PanResponder.move can compute finger-x relative
  // to the track. Updated by `onLayout` (which already gives us width) and
  // by a parent ref measurement on first grant if needed.
  const trackOriginRef = useRef(0);
  const trackRef = useRef<View | null>(null);
  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    widthRef.current = w;
    requestAnimationFrame(() => {
      trackRef.current?.measure((_x, _y, _w, _h, pageX) => {
        trackOriginRef.current = pageX;
      });
    });
  };

  const pct = clamp((value - MIN_KM) / (MAX_KM - MIN_KM), 0, 1);
  const filledWidth = trackWidth * pct;
  const thumbX = filledWidth - THUMB_SIZE / 2;

  return (
    <View accessible accessibilityRole="adjustable" accessibilityValue={{ min: MIN_KM, max: MAX_KM, now: value }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          onChange(clamp(quantize(value + STEP_KM, STEP_KM), MIN_KM, MAX_KM));
        } else if (event.nativeEvent.actionName === 'decrement') {
          onChange(clamp(quantize(value - STEP_KM, STEP_KM), MIN_KM, MAX_KM));
        }
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    >
      <View
        ref={trackRef}
        style={styles.trackArea}
        onLayout={onTrackLayout}
        {...responder.panHandlers}
      >
        <View style={styles.track} />
        {trackWidth > 0 ? (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: filledWidth }]}
          />
        ) : null}
        {trackWidth > 0 ? (
          <View
            style={[
              styles.thumb,
              { left: clamp(thumbX, 0, trackWidth - THUMB_SIZE) },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.ticks}>
        {TICKS.map((tick) => {
          const active = Math.abs(value - tick) < STEP_KM / 2;
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    // Outer accent ring rendered via a 1px shadow on iOS / android-specific
    // workaround. We keep it simple: rely on the contrast against the
    // gradient track.
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
