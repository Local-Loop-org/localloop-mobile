import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import { type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { MapPinData } from '../../types';

const SIZE = 26;
const SIZE_SELECTED = 32;

interface MapPinProps {
  pin: MapPinData;
  selected: boolean;
  dimmed: boolean;
  withLabel: boolean;
}

/**
 * The pure visual for a group marker — the rounded-square badge + anchor icon,
 * an optional live dot, and an optional name label. Geo positioning and press
 * handling live on the enclosing `<Marker>` in `MapCanvas`; this is just its
 * custom child view.
 */
export function MapPin({ pin, selected, dimmed, withLabel }: MapPinProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const square = selected ? SIZE_SELECTED : SIZE;

  return (
    <View style={[styles.wrap, { opacity: dimmed ? 0.35 : 1 }]}>
      <View
        style={[
          styles.marker,
          {
            width: square,
            height: square,
            borderRadius: selected ? 10 : 8,
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.line,
          },
        ]}
      >
        <Icon
          name={anchorIconName(pin.anchorType)}
          size={selected ? 15 : 12}
          color={selected ? colors.background : colors.text}
          strokeWidth={2.1}
        />
        {(pin.liveCount ?? 0) > 0 ? <View style={styles.liveDot} /> : null}
      </View>

      {withLabel ? (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>
            {pin.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    marker: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    liveDot: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.background,
    },
    label: {
      maxWidth: 110,
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: colors.surfaceOverlay,
      borderWidth: 1,
      borderColor: colors.line,
    },
    labelText: {
      fontSize: 10.5,
      fontWeight: '600',
      letterSpacing: -0.1,
      color: colors.text,
    },
  });
