import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

interface HeaderIconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  testID,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Icon name={icon} size={15} color={colors.text} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
