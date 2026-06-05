import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export interface ChipSpec<TId extends string = string> {
  id: TId;
  label: string;
  count?: number;
  icon?: IconName;
  dot?: boolean;
  /** Hide the label text visually while keeping it for accessibility. */
  hideLabel?: boolean;
}

interface FilterChipProps<TId extends string = string> {
  spec: ChipSpec<TId>;
  active: boolean;
  onPress: (id: TId) => void;
  /** Icon tint when inactive (defaults to a dim grey). */
  iconColor?: string;
}

export function FilterChip<TId extends string = string>({
  spec,
  active,
  onPress,
  iconColor,
}: FilterChipProps<TId>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onPress(spec.id)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        spec.count !== undefined ? `${spec.label}, ${spec.count}` : spec.label
      }
      testID={`filter-chip-${spec.id}`}
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
          color={active ? colors.background : (iconColor ?? colors.dim)}
          strokeWidth={2}
        />
      ) : null}
      {spec.dot ? (
        <View style={[styles.chipDot, active ? styles.chipDotActive : null]} />
      ) : null}
      {!spec.hideLabel ? (
        <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
          {spec.label}
        </Text>
      ) : null}
      {spec.count !== undefined ? (
        <Text
          style={[styles.chipCount, active ? styles.chipCountActive : null]}
        >
          {spec.count}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    chip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    chipIconLeading: {
      paddingLeft: 9,
      paddingRight: 11,
    },
    chipActive: {
      borderColor: c.text,
      backgroundColor: c.text,
    },
    chipLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: -0.1,
      color: c.dim,
    },
    chipLabelActive: {
      color: c.background,
    },
    chipCount: {
      fontSize: 10,
      fontFamily: monoFamily,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: c.faint,
    },
    chipCountActive: {
      color: c.background,
      opacity: 0.7,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.primary,
    },
    chipDotActive: {
      backgroundColor: c.background,
    },
  });
