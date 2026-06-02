import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';

interface RailButton {
  icon: IconName;
  label: string;
  color?: string;
  onPress: () => void;
}

interface MapActionRailProps {
  onRecenter: () => void;
  onCreate: () => void;
  onMyGroups: () => void;
}

export function MapActionRail({
  onRecenter,
  onCreate,
  onMyGroups,
}: MapActionRailProps) {
  const buttons: RailButton[] = [
    { icon: 'compass', label: 'Centralizar', onPress: onRecenter },
    { icon: 'plus', label: 'Criar grupo', onPress: onCreate },
    { icon: 'users', label: 'Meus grupos', onPress: onMyGroups },
  ];

  return (
    <View style={styles.rail}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.icon}
          activeOpacity={0.8}
          onPress={btn.onPress}
          accessibilityRole="button"
          accessibilityLabel={btn.label}
          style={styles.btn}
        >
          <Icon
            name={btn.icon}
            size={18}
            color={btn.color ?? colors.text}
            strokeWidth={2}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
