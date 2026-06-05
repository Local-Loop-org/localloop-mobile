import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import { useTheme } from '@/shared/theme/useTheme';
import { Icon, type IconName } from '@/shared/icons';

type DangerVariant = 'outlined' | 'filled';

interface DangerButtonProps {
  label: string;
  icon?: IconName;
  variant?: DangerVariant;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: PressableProps['accessibilityLabel'];
}

export function DangerButton({
  label,
  icon,
  variant = 'outlined',
  disabled,
  loading,
  onPress,
  testID,
  accessibilityLabel,
}: DangerButtonProps) {
  const { colors } = useTheme();
  const isFilled = variant === 'filled';
  const fg = disabled ? colors.faint : colors.error;
  const bg = disabled
    ? 'transparent'
    : isFilled
      ? colors.dangerSoft
      : 'transparent';
  const border = disabled ? colors.line : colors.dangerBorder;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? (
            <Icon
              name={icon}
              size={13}
              color={fg}
              strokeWidth={isFilled ? 2.2 : 2}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: fg, fontWeight: isFilled ? '700' : '600' },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 13.5,
  },
});
