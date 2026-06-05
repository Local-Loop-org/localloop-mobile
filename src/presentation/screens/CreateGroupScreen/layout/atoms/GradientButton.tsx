import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon, type IconName } from '@/shared/icons';

interface GradientButtonProps {
  label: string;
  leadingIcon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
}

export function GradientButton({
  label,
  leadingIcon,
  disabled = false,
  loading = false,
  onPress,
  testID,
}: GradientButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !isDisabled ? styles.pressed : null,
      ]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? [colors.surface, colors.surface]
            : [colors.primary, colors.secondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bg, isDisabled ? styles.bgDisabled : null]}
      >
        {loading ? (
          <ActivityIndicator color={colors.accentInk} />
        ) : (
          <View style={styles.row}>
            {leadingIcon ? (
              <Icon
                name={leadingIcon}
                size={15}
                color={isDisabled ? colors.faint : colors.accentInk}
                strokeWidth={2.5}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                isDisabled ? styles.labelDisabled : null,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  bg: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgDisabled: {
    borderColor: colors.line,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.accentInk,
  },
  labelDisabled: {
    color: colors.faint,
  },
});
