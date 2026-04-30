// src/presentation/navigation/types.ts

import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AnchorType, MemberRole } from '@localloop/shared-types';

export type HomeTabsParamList = {
  Home: undefined;
  Inbox: undefined;
  CreateGroup: undefined;
  Map: undefined;
  Profile: undefined;
};

export type AuthenticatedStackParamList = {
  HomeTabs: NavigatorScreenParams<HomeTabsParamList>;
  GroupDetail: { groupId: string };
  GroupMembers: { groupId: string; myRole: MemberRole | null };
  GroupChat: {
    groupId: string;
    groupName: string;
    anchorType: AnchorType;
    myRole: MemberRole | null;
  };
  MyGroups: undefined;
};

export type AuthenticatedStackScreenProps<
  T extends keyof AuthenticatedStackParamList,
> = NativeStackScreenProps<AuthenticatedStackParamList, T>;

export type HomeTabsScreenProps<T extends keyof HomeTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<HomeTabsParamList, T>,
    NativeStackScreenProps<AuthenticatedStackParamList>
  >;
