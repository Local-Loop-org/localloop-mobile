// src/presentation/navigation/types.ts

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnchorType, MemberRole } from '@localloop/shared-types';

/**
 * Route params for the authenticated stack. Keep in sync with
 * `AuthenticatedStack.tsx`.
 */
export type AuthenticatedStackParamList = {
  GroupDiscovery: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  GroupMembers: { groupId: string; myRole: MemberRole | null };
  GroupChat: {
    groupId: string;
    groupName: string;
    anchorType: AnchorType;
    myRole: MemberRole | null;
  };
};

export type AuthenticatedStackScreenProps<
  T extends keyof AuthenticatedStackParamList,
> = NativeStackScreenProps<AuthenticatedStackParamList, T>;
