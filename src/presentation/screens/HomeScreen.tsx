// src/presentation/screens/HomeScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { colors, spacing, typography } from '@/shared/theme';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={typography.h2}>Olá, {user?.displayName}!</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Você está logado no LocalLoop. Em breve, você verá grupos próximos aqui.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  logoutBtn: {
    padding: spacing.md,
  },
  logoutBtnText: {
    color: colors.error,
    fontWeight: '600',
  },
});
