import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { HeaderIconButton } from '../atoms/HeaderIconButton';

interface HeaderBarProps {
  onClose: () => void;
}

export function HeaderBar({ onClose }: HeaderBarProps) {
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

const styles = StyleSheet.create({
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
