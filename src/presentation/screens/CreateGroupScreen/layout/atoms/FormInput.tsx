import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon, type IconName } from '@/shared/icons';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  leadingIcon?: IconName;
  testID?: string;
  /** When true, render as plain text (no border, no editing). */
  readOnly?: boolean;
}

export function FormInput({
  leadingIcon,
  readOnly,
  value,
  ...rest
}: FormInputProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  if (readOnly) {
    return (
      <View style={[styles.wrap, styles.readOnlyWrap]}>
        {leadingIcon ? (
          <View style={styles.icon}>
            <Icon
              name={leadingIcon}
              size={14}
              color={colors.dim}
              strokeWidth={1.8}
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.readOnlyText,
            leadingIcon ? styles.readOnlyTextWithIcon : null,
          ]}
          numberOfLines={1}
          testID={rest.testID}
        >
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {leadingIcon ? (
        <View style={styles.icon}>
          <Icon
            name={leadingIcon}
            size={14}
            color={colors.dim}
            strokeWidth={1.8}
          />
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.faint}
        value={value}
        {...rest}
        style={[styles.input, leadingIcon ? styles.inputWithIcon : null]}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  readOnlyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  icon: {
    position: 'absolute',
    left: 13,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 14,
  },
  inputWithIcon: {
    paddingLeft: 38,
  },
  readOnlyText: {
    color: colors.text,
    fontSize: 14,
  },
  readOnlyTextWithIcon: {
    paddingLeft: 38,
  },
});
