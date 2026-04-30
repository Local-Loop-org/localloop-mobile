import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import InboxScreen from "../screens/InboxScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import MapScreen from "../screens/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { BottomTabBar } from "../screens/HomeScreen/layout/BottomTabBar";
import type { HomeTabsParamList } from "./types";

const Tab = createBottomTabNavigator<HomeTabsParamList>();

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name ?? "Home";
  if (currentRoute === "CreateGroup") return null;
  return (
    <BottomTabBar
      active={currentRoute as keyof HomeTabsParamList}
      onPress={(tab) => navigation.navigate(tab)}
    />
  );
}

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
