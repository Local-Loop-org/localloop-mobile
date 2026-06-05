import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { HeaderIconButton } from '../atoms/HeaderIconButton';

interface HeaderBarProps {
  onClose: () => void;
}

export function HeaderBar({ onClose }: HeaderBarProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <HeaderIconButton
        icon="x"
        onPress={onClose}
        accessibilityLabel="Cancelar"
        testID="create-group-close"
      />
      <Text style={styles.title}>NOVO GRUPO</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
    letterSpacing: 1.6,
  },
  spacer: {
    width: 36,
    height: 36,
  },
});
