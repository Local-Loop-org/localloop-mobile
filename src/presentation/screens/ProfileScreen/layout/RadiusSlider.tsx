import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Props {
  value: number;
  onCommit: (km: number) => void;
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

export default function RadiusSlider({
  value,
  onCommit,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [draftKm, setDraftKm] = useState(value);

  useEffect(() => {
    setDraftKm(value);
  }, [value]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const valueFromLocalX = (localX: number) => {
    if (trackWidth <= 0) return draftKm;
    const ratio = Math.max(0, Math.min(1, localX / trackWidth));
    return snap(clampKm(MIN + ratio * (MAX - MIN)));
  };

  const setDraftFromLocalX = (localX: number) => {
    setDraftKm(valueFromLocalX(localX));
  };

  const commitFromLocalX = (localX: number) => {
    const next = valueFromLocalX(localX);
    setDraftKm(next);
    onCommit(next);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) =>
      setDraftFromLocalX(event.nativeEvent.locationX),
    onPanResponderMove: (event) =>
      setDraftFromLocalX(event.nativeEvent.locationX),
    onPanResponderRelease: (event) =>
      commitFromLocalX(event.nativeEvent.locationX),
    onPanResponderTerminate: (event) =>
      commitFromLocalX(event.nativeEvent.locationX),
  });

  const pct = ((clampKm(draftKm) - MIN) / (MAX - MIN)) * 100;
  const thumbLeft = trackWidth > 0 ? (pct / 100) * trackWidth - 9 : 0;

  return (
    <>
      <View style={styles.radiusHeader}>
        <View style={[styles.rowIconBubble, { backgroundColor: colors.primarySoft }]}>
          <Icon name='radar' size={14} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Raio de descoberta</Text>
          <Text style={styles.toggleSub}>
            Mostra grupos dentro deste raio ao redor de você
          </Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusBadgeLabel}>{formatKm(draftKm)}</Text>
        </View>
      </View>

      <View style={styles.radiusTrackWrap}>
        <View
          onLayout={handleLayout}
          style={{ paddingVertical: 10 }}
          accessibilityRole='adjustable'
          accessibilityLabel='Raio de descoberta'
          accessibilityValue={{ text: formatKm(draftKm) }}
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
          const active = Math.abs(draftKm - t) < 0.01;
          return (
            <Pressable
              key={t}
              style={styles.radiusTickBtn}
              onPress={() => {
                setDraftKm(t);
                onCommit(t);
              }}
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
