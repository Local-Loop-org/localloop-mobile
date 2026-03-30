// src/domain/user.entity.ts

export enum DmPermission {
  NOBODY = 'nobody',
  MEMBERS = 'members',
  EVERYONE = 'everyone',
}

export enum Provider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export interface User {
  id: string;
  providerId: string;
  provider: Provider;
  displayName: string;
  avatarUrl: string | null;
  geohash: string | null;
  dmPermission: DmPermission;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
}
