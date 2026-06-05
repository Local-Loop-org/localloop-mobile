import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GroupPrivacy } from '@localloop/shared-types';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon, type IconName } from '@/shared/icons';

interface PrivacyOption {
  value: GroupPrivacy;
  label: string;
  sub: string;
  icon: IconName;
}

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    value: GroupPrivacy.OPEN,
    label: 'Aberto',
    sub: 'Qualquer um pode entrar',
    icon: 'globe',
  },
  {
    value: GroupPrivacy.APPROVAL_REQUIRED,
    label: 'Requer aprovação',
    sub: 'Você aprova cada entrada',
    icon: 'lock',
  },
];

interface PrivacyCardProps {
  option: PrivacyOption;
  selected: boolean;
  onPress?: (value: GroupPrivacy) => void;
  /** When true, render as a flat info card (no border highlight, no check, no press). */
  readOnly?: boolean;
}

export function PrivacyCard({
  option,
  selected,
  onPress,
  readOnly,
}: PrivacyCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const Inner = (
    <>
      <View style={styles.iconWrap}>
        <Icon
          name={option.icon}
          size={15}
          color={selected || readOnly ? colors.primary : colors.dim}
          strokeWidth={1.9}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{option.label}</Text>
        <Text style={styles.sub}>{option.sub}</Text>
      </View>
      {selected && !readOnly ? (
        <Icon name="check" size={16} color={colors.primary} strokeWidth={2.5} />
      ) : null}
    </>
  );

  if (readOnly) {
    return (
      <View
        style={[styles.card, styles.cardReadOnly]}
        accessibilityRole="text"
        testID={`privacy-card-${option.value}`}
      >
        {Inner}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress?.(option.value)}
      style={[styles.card, selected ? styles.cardActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={`privacy-card-${option.value}`}
    >
      {Inner}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 13,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  cardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  cardReadOnly: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    color: colors.dim,
    lineHeight: 17,
  },
});
