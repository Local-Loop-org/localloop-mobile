import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import { colors, spacing, typography } from '@/shared/theme';
import { Icon } from '@/shared/icons';

type Props = AuthenticatedStackScreenProps<'MyGroups'>;

export default function MyGroupsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backBtn}
        >
          <Icon name="chevronLeft" size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Meus grupos</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.center}>
        <Text style={styles.label}>Em breve</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
