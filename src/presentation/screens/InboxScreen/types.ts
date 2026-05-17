import { HomeTabsScreenProps } from '@/presentation/navigation/types';
export type InboxScreenProps = HomeTabsScreenProps<'Inbox'>;

import type { UserSummary } from '@localloop/shared-types';

export type InboxFilterId = 'all' | 'unread' | 'requests' | 'archived';

export type DmPeer = Pick<UserSummary, 'id' | 'displayName' | 'avatarUrl'>;

export interface DmMessagePreview {
  content: string;
  createdAt: string;
  fromMe: boolean;
}

export interface DmConversation {
  id: string;
  peer: DmPeer;
  lastMessage: DmMessagePreview | null;
  unreadCount: number;
  isArchived: boolean;
}

export interface DmRequest {
  id: string;
  peer: DmPeer;
  message: string;
  createdAt: string;
}
