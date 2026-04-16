import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import * as Location from 'expo-location';
import OnboardingLayout from './layout';

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
    <OnboardingLayout
      displayName={displayName}
      locationGranted={locationGranted}
      onDisplayNameChange={setDisplayName}
      onRequestLocation={requestLocation}
      onFinish={handleFinish}
    />
  );
}
