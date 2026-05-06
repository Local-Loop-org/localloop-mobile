import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

export type SendPermValue = 'all' | 'within_radius' | 'admins_only';

interface SendPermOption {
  value: SendPermValue;
  label: string;
  sub: string;
  icon: IconName;
}

export const SEND_PERM_OPTIONS: SendPermOption[] = [
  {
    value: 'all',
    label: 'Todos',
    sub: 'Qualquer membro',
    icon: 'users',
  },
  {
    value: 'within_radius',
    label: 'Dentro do raio',
    sub: 'Só quem está no raio do grupo',
    icon: 'radar',
  },
  {
    value: 'admins_only',
    label: 'Só admins',
    sub: 'Apenas administradores',
    icon: 'shield',
  },
];

interface SendPermPickerProps {
  value: SendPermValue;
  onChange: (value: SendPermValue) => void;
  /** Used to scope `testID`s when the same picker is rendered twice on a screen. */
  testIdPrefix?: string;
}

export function SendPermPicker({
  value,
  onChange,
  testIdPrefix,
}: SendPermPickerProps) {
  return (
    <View style={styles.list}>
      {SEND_PERM_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.row, active ? styles.rowActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            testID={
              testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined
            }
          >
            <View style={[styles.iconWrap, active ? styles.iconWrapActive : null]}>
              <Icon
                name={option.icon}
                size={12}
                color={active ? colors.accentInk : colors.dim}
                strokeWidth={2}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.sub}>{option.sub}</Text>
            </View>
            {active ? (
              <Icon
                name="check"
                size={13}
                color={colors.primary}
                strokeWidth={2.5}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'column',
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    borderColor: 'transparent',
    borderWidth: 1,
  },
  rowActive: {
    backgroundColor: 'rgba(0,209,255,0.12)',
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sub: {
    fontSize: 10.5,
    color: colors.dim,
    marginTop: 1,
  },
});
