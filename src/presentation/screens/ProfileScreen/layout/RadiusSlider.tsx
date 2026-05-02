import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  value: number;
  onChange: (km: number) => void;
}

const MIN = 0.5;
const MAX = 25;
const TICKS = [0.5, 2, 5, 10, 25];

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const fixed = km % 1 === 0 ? km.toFixed(0) : km.toFixed(1);
  return `${fixed} km`;
}

const clampKm = (v: number) => Math.max(MIN, Math.min(MAX, v));
const snap = (km: number) => Math.round(km * 2) / 2;

export default function RadiusSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const trackWidthRef = useRef(0);
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);

  // Keep refs fresh so the PanResponder factory (memoized once) reads current
  // values without rebuilding the responder on every render.
  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);
  useEffect(() => {
    lastEmitted.current = value;
  }, [value]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
    });
  };

  const panResponder = useMemo(
    () => {
      const setFromPageX = (pageX: number) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const local = pageX - trackPageX.current;
        const ratio = Math.max(0, Math.min(1, local / w));
        const next = snap(clampKm(MIN + ratio * (MAX - MIN)));
        if (next !== lastEmitted.current) {
          lastEmitted.current = next;
          onChangeRef.current(next);
        }
      };
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_e, gs) => setFromPageX(gs.x0),
        onPanResponderMove: (_e, gs) => setFromPageX(gs.moveX),
      });
    },
    [],
  );

  const pct = ((clampKm(value) - MIN) / (MAX - MIN)) * 100;
  const thumbLeft = trackWidth > 0 ? (pct / 100) * trackWidth - 9 : 0;

  return (
    <>
      <View style={styles.radiusHeader}>
        <View style={[styles.rowIconBubble, { backgroundColor: 'rgba(0,209,255,0.1)' }]}>
          <Icon name='radar' size={14} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Raio de descoberta</Text>
          <Text style={styles.toggleSub}>
            Mostra grupos dentro deste raio ao redor de você
          </Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusBadgeLabel}>{formatKm(value)}</Text>
        </View>
      </View>

      <View style={styles.radiusTrackWrap}>
        <View
          ref={trackRef}
          onLayout={handleLayout}
          style={{ paddingVertical: 10 }}
          accessibilityRole='adjustable'
          accessibilityLabel='Raio de descoberta'
          accessibilityValue={{ text: formatKm(value) }}
          {...panResponder.panHandlers}
        >
          <View style={styles.radiusTrack}>
            <LinearGradient
              colors={[colors.primary, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.radiusFill, { width: `${pct}%` }]}
            />
          </View>
          {trackWidth > 0 ? (
            <View
              style={[styles.radiusThumb, { left: thumbLeft, top: 8 }]}
              pointerEvents='none'
            />
          ) : null}
        </View>
      </View>

      <View style={styles.radiusTicks}>
        {TICKS.map((t) => {
          const active = Math.abs(value - t) < 0.01;
          return (
            <Pressable
              key={t}
              style={styles.radiusTickBtn}
              onPress={() => onChange(t)}
              accessibilityRole='button'
              accessibilityLabel={`Definir raio para ${formatKm(t)}`}
            >
              <Text
                style={[
                  styles.radiusTickLabel,
                  active && styles.radiusTickLabelActive,
                ]}
              >
                {t < 1 ? `${t * 1000}M` : `${t}KM`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
