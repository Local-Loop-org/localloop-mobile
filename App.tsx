// App.tsx

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/presentation/navigation/RootNavigator';
import { queryClient } from './src/infra/react-query/client';
import { ChatSocketProvider } from './src/infra/socket/ChatSocketProvider';
import { applyDefaultFont } from './src/shared/theme/applyDefaultFont';
import { useTheme } from './src/shared/theme/useTheme';

// Set Space Grotesk as the app-wide default font once, before any render.
applyDefaultFont();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatSocketProvider>
        <SafeAreaProvider>
          <ThemedStatusBar />
          <RootNavigator />
        </SafeAreaProvider>
      </ChatSocketProvider>
    </QueryClientProvider>
  );
}
