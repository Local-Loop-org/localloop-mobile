import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
// TEMP: Inbox tab is pointed at the DM redesign mockup for visual review.
// Restore by un-commenting the InboxScreen import and swapping the component below.
// import InboxScreen from "../screens/InboxScreen";
import DmChatMockupScreen from "../screens/DmChatMockupScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
// TEMP: Map tab is pointed at the Group redesign mockup for visual review.
// Restore by un-commenting the MapScreen import and swapping the component below.
// import MapScreen from "../screens/MapScreen";
import GroupChatMockupScreen from "../screens/GroupChatMockupScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { BottomTabBar } from "../screens/HomeScreen/layout/BottomTabBar";
import type { HomeTabsParamList } from "./types";
import { TabRoutes } from "./routes";

const Tab = createBottomTabNavigator<HomeTabsParamList>();

function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name ?? TabRoutes.Home;
  if (currentRoute === TabRoutes.CreateGroup) return null;
  // TEMP: Inbox tab currently renders the DM redesign mockup — hide the nav
  // bar so the mockup gets the full-screen rhythm of a real chat. Remove this
  // line when InboxScreen is restored.
  if (currentRoute === TabRoutes.Inbox) return null;
  // TEMP: Map tab currently renders the Group redesign mockup — same reason.
  if (currentRoute === TabRoutes.Map) return null;
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
      <Tab.Screen name={TabRoutes.Inbox} component={DmChatMockupScreen} />
      <Tab.Screen
        name={TabRoutes.CreateGroup}
        component={CreateGroupScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name={TabRoutes.Map} component={GroupChatMockupScreen} />
      <Tab.Screen name={TabRoutes.Profile} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
