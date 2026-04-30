// src/presentation/navigation/AuthenticatedStack.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeTabs from "./HomeTabs";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import GroupMembersScreen from "../screens/GroupMembersScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import MyGroupsScreen from "../screens/MyGroupsScreen";
import type { AuthenticatedStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthenticatedStackParamList>();

export default function AuthenticatedStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="MyGroups" component={MyGroupsScreen} />
    </Stack.Navigator>
  );
}
