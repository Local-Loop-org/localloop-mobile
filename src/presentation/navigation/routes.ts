export const RootRoutes = {
  AuthStack: 'AuthStack',
  Onboarding: 'Onboarding',
  Home: 'Home',
} as const;

export const AuthRoutes = {
  Login: 'Login',
  Onboarding: 'Onboarding',
} as const;

export const StackRoutes = {
  HomeTabs: 'HomeTabs',
  GroupDetail: 'GroupDetail',
  GroupMembers: 'GroupMembers',
  GroupChat: 'GroupChat',
  MyGroups: 'MyGroups',
} as const;

export const TabRoutes = {
  Home: 'Home',
  Inbox: 'Inbox',
  CreateGroup: 'CreateGroup',
  Map: 'Map',
  Profile: 'Profile',
} as const;

export type TabRoute = (typeof TabRoutes)[keyof typeof TabRoutes];
