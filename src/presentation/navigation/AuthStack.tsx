// src/presentation/navigation/AuthStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { AuthRoutes } from './routes';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AuthRoutes.Login} component={LoginScreen} />
      <Stack.Screen name={AuthRoutes.Onboarding} component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
