import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnchorType } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { Icon, anchorIconName } from '@/shared/icons';
import { ANCHOR_TYPE_LABELS } from '@/shared/anchor/labels';

const TYPES: AnchorType[] = [
  AnchorType.ESTABLISHMENT,
  AnchorType.NEIGHBORHOOD,
  AnchorType.CONDO,
  AnchorType.EVENT,
  AnchorType.CITY,
];

interface PlaceTypeChipsProps {
  value: AnchorType;
  onChange: (value: AnchorType) => void;
}

export function PlaceTypeChips({ value, onChange }: PlaceTypeChipsProps) {
  return (
    <View style={styles.row}>
      {TYPES.map((type) => {
        const active = type === value;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={[styles.chip, active ? styles.chipActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            testID={`place-chip-${type}`}
          >
            <Icon
              name={anchorIconName(type)}
              size={12}
              color={active ? colors.accentInk : colors.dim}
              strokeWidth={1.8}
            />
            <Text
              style={[styles.label, active ? styles.labelActive : null]}
            >
              {ANCHOR_TYPE_LABELS[type]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.dim,
  },
  labelActive: {
    color: colors.accentInk,
  },
});
