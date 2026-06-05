import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import type { ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface FormTextAreaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  rows?: number;
}

export function FormTextArea({ rows = 3, ...rest }: FormTextAreaProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      {...rest}
      multiline
      style={[styles.input, { minHeight: 24 * rows }]}
      textAlignVertical="top"
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
});
