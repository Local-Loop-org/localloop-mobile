// src/presentation/screens/OnboardingScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { colors, spacing, typography } from '@/shared/theme';
import * as Location from 'expo-location';

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const setNewUserStatus = useAuthStore((state) => state.setNewUserStatus);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
      } else {
        Alert.alert('Localização', 'Precisamos da sua localização para mostrar grupos próximos.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao solicitar permissão de localização');
    }
  };

  const handleFinish = () => {
    if (!displayName || displayName.length < 2) {
      Alert.alert('Ops', 'Por favor, insira seu nome.');
      return;
    }
    if (!locationGranted) {
      Alert.alert('Ops', 'Por favor, conceda permissão de localização.');
      return;
    }
    setNewUserStatus(false);
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>Boas-vindas!</Text>
      <Text style={[typography.body, styles.subtitle]}>
        Vamos configurar seu perfil básico. Sua localização exata nunca será compartilhada.
      </Text>

      <Text style={styles.label}>Como quer ser chamado?</Text>
      <TextInput
        style={styles.input}
        placeholder="Seu nome ou apelido"
        placeholderTextColor={colors.textSecondary}
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TouchableOpacity 
        style={[styles.locationBtn, locationGranted && styles.locationGranted]} 
        onPress={requestLocation}
      >
        <Text style={styles.locationBtnText}>
          {locationGranted ? 'Localização Concedida! ✅' : 'Permitir Localização 📍'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
        <Text style={styles.finishBtnText}>Começar a Explorar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  locationBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  locationGranted: {
    backgroundColor: colors.primary + '20', // semi-transparent primary
    borderColor: colors.success,
  },
  locationBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  finishBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
});
