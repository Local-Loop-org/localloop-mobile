// src/presentation/navigation/RootNavigator.tsx

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/application/stores/auth.store';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import AuthStack from './AuthStack';
import AuthenticatedStack from './AuthenticatedStack';
import OnboardingScreen from '../screens/OnboardingScreen';
import { RootRoutes } from './routes';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/shared/theme';
import { rootNavigationRef } from './navigationRef';
import {
  flushPendingPushNotificationRoute,
  registerPushNotificationRouting,
  setPushNotificationRoutingEnabled,
} from './pushNotificationRouting';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isNewUser, initialize } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initialize(),
        usePreferencesStore.getState().initialize(),
      ]);
      setLoading(false);
    };
    init();
  }, [initialize]);

  useEffect(() => {
    const subscription = registerPushNotificationRouting();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setPushNotificationRoutingEnabled(
      !loading && isAuthenticated && !isNewUser,
    );
    return () => setPushNotificationRoutingEnabled(false);
  }, [isAuthenticated, isNewUser, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      onReady={flushPendingPushNotificationRoute}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name={RootRoutes.AuthStack} component={AuthStack} />
        ) : isNewUser ? (
          <Stack.Screen name={RootRoutes.Onboarding} component={OnboardingScreen} />
        ) : (
          <Stack.Screen name={RootRoutes.Home} component={AuthenticatedStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
