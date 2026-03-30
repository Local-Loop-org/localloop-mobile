// src/presentation/navigation/RootNavigator.tsx

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/application/stores/auth.store';
import AuthStack from './AuthStack';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/shared/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isNewUser, initialize } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setLoading(false);
    };
    init();
  }, [initialize]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        ) : isNewUser ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
