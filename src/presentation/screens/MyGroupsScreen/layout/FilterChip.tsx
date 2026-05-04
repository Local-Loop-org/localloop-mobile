import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';
import type { ChipSpec } from './types';
import type { MyGroupsFilter } from '../types';

interface Props {
  spec: ChipSpec;
  active: boolean;
  onPress: (id: MyGroupsFilter) => void;
}

export function FilterChip({ spec, active, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(spec.id)}
      accessibilityRole='button'
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${spec.label}, ${spec.count}`}
      style={[
        styles.chip,
        spec.icon ? styles.chipIconLeading : null,
        active ? styles.chipActive : null,
      ]}
    >
      {spec.icon ? (
        <Icon
          name={spec.icon}
          size={12}
          color={active ? colors.background : colors.dim}
          strokeWidth={2}
        />
      ) : null}
      {spec.dot ? (
        <View style={[styles.chipDot, active ? styles.chipDotActive : null]} />
      ) : null}
      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
        {spec.label}
      </Text>
      <Text style={[styles.chipCount, active ? styles.chipCountActive : null]}>
        {spec.count}
      </Text>
    </TouchableOpacity>
  );
}
