import React, { useState } from 'react';
import {
  LayoutChangeEvent,
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

function clamp(value: number): number {
  return Math.max(MIN, Math.min(MAX, value));
}

function snap(km: number): number {
  return Math.round(km * 2) / 2;
}

export default function RadiusSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const handleTrackPress = (e: { nativeEvent: { locationX: number } }) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth));
    const next = snap(clamp(MIN + ratio * (MAX - MIN)));
    if (next !== value) onChange(next);
  };

  const pct = ((clamp(value) - MIN) / (MAX - MIN)) * 100;
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
        <Pressable
          onPress={handleTrackPress}
          onLayout={handleLayout}
          accessibilityRole='adjustable'
          accessibilityLabel='Raio de descoberta'
          accessibilityValue={{ text: formatKm(value) }}
          style={{ paddingVertical: 10 }}
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
              style={[
                styles.radiusThumb,
                { left: thumbLeft, top: 8 },
              ]}
              pointerEvents='none'
            />
          ) : null}
        </Pressable>
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
