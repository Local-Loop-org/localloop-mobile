import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, typography } from '@/shared/theme';
import { styles } from './styles';
import { OnboardingLayoutProps } from './types';

export default function OnboardingLayout({
  displayName,
  locationGranted,
  isLoading,
  onDisplayNameChange,
  onRequestLocation,
  onFinish,
}: OnboardingLayoutProps) {
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
        onChangeText={onDisplayNameChange}
      />

      <TouchableOpacity
        style={[styles.locationBtn, locationGranted && styles.locationGranted]}
        onPress={onRequestLocation}
      >
        <Text style={styles.locationBtnText}>
          {locationGranted ? 'Localização Concedida! ✅' : 'Permitir Localização 📍'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.finishBtn, isLoading && { opacity: 0.6 }]}
        onPress={onFinish}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.finishBtnText}>Começar a Explorar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
