// src/presentation/navigation/types.ts

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Route params for the authenticated stack. Keep in sync with
 * `AuthenticatedStack.tsx`.
 */
export type AuthenticatedStackParamList = {
  GroupDiscovery: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
};

export type AuthenticatedStackScreenProps<
  T extends keyof AuthenticatedStackParamList,
> = NativeStackScreenProps<AuthenticatedStackParamList, T>;
