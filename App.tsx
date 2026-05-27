// App.tsx

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/presentation/navigation/RootNavigator';
import { queryClient } from './src/infra/react-query/client';
import { ChatSocketProvider } from './src/infra/socket/ChatSocketProvider';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatSocketProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SafeAreaProvider>
      </ChatSocketProvider>
    </QueryClientProvider>
  );
}
