import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { Icon } from '@/shared/icons';

interface HeaderBarProps {
  onBack: () => void;
}

export function HeaderBar({ onBack }: HeaderBarProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        testID="group-detail-back"
      >
        <Icon name="back" size={15} color={colors.text} strokeWidth={2} />
      </Pressable>
      <Text style={styles.title}>GRUPO</Text>
      <View style={styles.iconBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
    letterSpacing: 1.6,
  },
});
