// src/presentation/navigation/AuthenticatedStack.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeTabs from "./HomeTabs";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import GroupMembersScreen from "../screens/GroupMembersScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import MyGroupsScreen from "../screens/MyGroupsScreen";
import type { AuthenticatedStackParamList } from "./types";
import { StackRoutes } from "./routes";

const Stack = createNativeStackNavigator<AuthenticatedStackParamList>();

export default function AuthenticatedStack() {
  return (
    <Stack.Navigator
      initialRouteName={StackRoutes.HomeTabs}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={StackRoutes.HomeTabs} component={HomeTabs} />
      <Stack.Screen name={StackRoutes.GroupDetail} component={GroupDetailScreen} />
      <Stack.Screen name={StackRoutes.GroupMembers} component={GroupMembersScreen} />
      <Stack.Screen name={StackRoutes.GroupChat} component={GroupChatScreen} />
      <Stack.Screen name={StackRoutes.MyGroups} component={MyGroupsScreen} />
    </Stack.Navigator>
  );
}
