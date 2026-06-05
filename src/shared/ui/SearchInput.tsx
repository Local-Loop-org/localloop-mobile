import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { spacing, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  accessibilityLabel,
  testID,
}: SearchInputProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Icon name="search" size={14} color={colors.faint} strokeWidth={2} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={accessibilityLabel ?? placeholder}
          testID={testID}
        />
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    input: {
      flex: 1,
      fontSize: 13,
      color: c.text,
      padding: 0,
    },
  });
