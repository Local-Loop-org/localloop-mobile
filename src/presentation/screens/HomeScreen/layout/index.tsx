import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { typography } from '@/shared/theme';
import { styles } from './styles';
import { HomeLayoutProps } from './types';

export default function HomeLayout({ displayName, onLogout }: HomeLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={typography.h2}>Olá, {displayName}!</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Você está logado no LocalLoop. Em breve, você verá grupos próximos aqui.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
