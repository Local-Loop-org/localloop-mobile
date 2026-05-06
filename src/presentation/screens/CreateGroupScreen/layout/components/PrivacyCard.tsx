import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GroupPrivacy } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
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
  onPress: (value: GroupPrivacy) => void;
}

export function PrivacyCard({ option, selected, onPress }: PrivacyCardProps) {
  return (
    <Pressable
      onPress={() => onPress(option.value)}
      style={[styles.card, selected ? styles.cardActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={`privacy-card-${option.value}`}
    >
      <View
        style={[styles.iconWrap, selected ? styles.iconWrapActive : null]}
      >
        <Icon
          name={option.icon}
          size={15}
          color={selected ? colors.primary : colors.dim}
          strokeWidth={1.9}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{option.label}</Text>
        <Text style={styles.sub}>{option.sub}</Text>
      </View>
      {selected ? (
        <Icon name="check" size={16} color={colors.primary} strokeWidth={2.5} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(0,209,255,0.10)',
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.surface2,
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
