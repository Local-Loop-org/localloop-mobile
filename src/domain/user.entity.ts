// src/domain/user.entity.ts

import { DmPermission, Provider } from '@localloop/shared-types';

export { DmPermission, Provider };

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
