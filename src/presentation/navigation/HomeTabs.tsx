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
import { TabRoutes } from "./routes";

const Tab = createBottomTabNavigator<HomeTabsParamList>();

function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name ?? TabRoutes.Home;
  if (currentRoute === TabRoutes.CreateGroup) return null;
  return (
    <BottomTabBar
      active={currentRoute as keyof HomeTabsParamList}
      onPress={(tab) => navigation.navigate(tab)}
      bottomInset={insets.bottom}
    />
  );
}

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name={TabRoutes.Home} component={HomeScreen} />
      <Tab.Screen name={TabRoutes.Inbox} component={InboxScreen} />
      <Tab.Screen
        name={TabRoutes.CreateGroup}
        component={CreateGroupScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name={TabRoutes.Map} component={MapScreen} />
      <Tab.Screen name={TabRoutes.Profile} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
