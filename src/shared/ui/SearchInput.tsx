import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors, spacing } from '@/shared/theme';

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

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
});
