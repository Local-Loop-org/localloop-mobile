// src/presentation/navigation/RootNavigator.tsx

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { useAuthStore } from '@/application/stores/auth.store';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import { useThemeStore } from '@/application/stores/theme.store';
import { useTheme } from '@/shared/theme/useTheme';
import AuthStack from './AuthStack';
import AuthenticatedStack from './AuthenticatedStack';
import OnboardingScreen from '../screens/OnboardingScreen';
import { RootRoutes } from './routes';
import { ActivityIndicator, View } from 'react-native';
import { rootNavigationRef } from './navigationRef';
import {
  flushPendingPushNotificationRoute,
  registerPushNotificationRouting,
  setPushNotificationRoutingEnabled,
} from './pushNotificationRouting';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isNewUser, initialize } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [storesReady, setStoresReady] = React.useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  const loading = !storesReady || !fontsLoaded;

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initialize(),
        usePreferencesStore.getState().initialize(),
        useThemeStore.getState().initialize(),
      ]);
      setStoresReady(true);
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

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.line,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      theme={navTheme}
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
