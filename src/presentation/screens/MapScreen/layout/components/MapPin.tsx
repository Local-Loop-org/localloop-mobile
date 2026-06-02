import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import { colors } from '@/shared/theme';
import type { MapPinData } from '../../types';

const SIZE = 26;
const SIZE_SELECTED = 32;

interface MapPinProps {
  pin: MapPinData;
  selected: boolean;
  dimmed: boolean;
  withLabel: boolean;
  onSelect: (id: string) => void;
}

export function MapPin({ pin, selected, dimmed, withLabel, onSelect }: MapPinProps) {
  const square = selected ? SIZE_SELECTED : SIZE;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(pin.id)}
      testID={`map-pin-${pin.id}`}
      accessibilityRole="button"
      accessibilityLabel={pin.name}
      accessibilityState={{ selected }}
      style={[
        styles.wrap,
        {
          left: `${pin.x * 100}%`,
          top: `${pin.y * 100}%`,
          transform: [{ translateX: -square / 2 }, { translateY: -square / 2 }],
          opacity: dimmed ? 0.35 : 1,
          zIndex: selected ? 25 : 10,
        },
      ]}
    >
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
        {pin.liveCount > 0 ? <View style={styles.liveDot} /> : null}
      </View>

      {withLabel ? (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>
            {pin.name}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
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
    backgroundColor: 'rgba(15,15,15,0.85)',
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
