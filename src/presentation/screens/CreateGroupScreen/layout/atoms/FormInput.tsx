import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  leadingIcon?: IconName;
  testID?: string;
}

export function FormInput({ leadingIcon, ...rest }: FormInputProps) {
  return (
    <View style={styles.wrap}>
      {leadingIcon ? (
        <View style={styles.icon}>
          <Icon name={leadingIcon} size={14} color={colors.dim} strokeWidth={1.8} />
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.faint}
        {...rest}
        style={[styles.input, leadingIcon ? styles.inputWithIcon : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
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
});
