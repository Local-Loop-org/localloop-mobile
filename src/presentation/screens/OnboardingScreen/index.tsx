import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { userApi } from '@/infra/api/user.api';
import * as Location from 'expo-location';
import OnboardingLayout from './layout';

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setNewUserStatus = useAuthStore((state) => state.setNewUserStatus);
  const updateUser = useAuthStore((state) => state.updateUser);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
        setLocationGranted(true);
      } else {
        Alert.alert('Localização', 'Precisamos da sua localização para mostrar grupos próximos.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao solicitar permissão de localização');
    }
  };

  const handleFinish = async () => {
    if (!displayName || displayName.length < 2) {
      Alert.alert('Ops', 'Por favor, insira seu nome.');
      return;
    }
    if (!locationGranted || !coords) {
      Alert.alert('Ops', 'Por favor, conceda permissão de localização.');
      return;
    }

    setIsLoading(true);
    try {
      const [profileResult] = await Promise.all([
        userApi.updateProfile({ displayName }),
        userApi.updateLocation(coords),
      ]);

      await updateUser({ displayName: profileResult.displayName });
      setNewUserStatus(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      displayName={displayName}
      locationGranted={locationGranted}
      isLoading={isLoading}
      onDisplayNameChange={setDisplayName}
      onRequestLocation={requestLocation}
      onFinish={handleFinish}
    />
  );
}
