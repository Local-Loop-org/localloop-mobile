// src/presentation/navigation/AuthenticatedStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupDiscoveryScreen from '../screens/GroupDiscoveryScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import type { AuthenticatedStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthenticatedStackParamList>();

export default function AuthenticatedStack() {
  return (
    <Stack.Navigator
      initialRouteName="GroupDiscovery"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="GroupDiscovery" component={GroupDiscoveryScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
    </Stack.Navigator>
  );
}
