import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/application/stores/auth.store';
import { userApi } from '@/infra/api/user.api';
import { useCurrentLocation } from '@/application/hooks/useCurrentLocation';
import OnboardingLayout from './layout';

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { coords, granted: locationGranted, request } = useCurrentLocation();
  const setNewUserStatus = useAuthStore((state) => state.setNewUserStatus);
  const updateUser = useAuthStore((state) => state.updateUser);

  const requestLocation = async () => {
    const result = await request();
    if (!result) {
      Alert.alert(
        'Localização',
        'Precisamos da sua localização para mostrar grupos próximos.',
      );
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
