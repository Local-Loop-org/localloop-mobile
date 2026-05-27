import type { ChatMessage, DirectMessageStatus } from '@localloop/shared-types';

export type DmPeerStatus =
  | { kind: 'online' }
  | { kind: 'typing' }
  | { kind: 'lastSeen'; at: string }
  | null;

export interface DmChatLayoutProps {
  peerName: string;
  peerAvatarUrl: string | null;
  peerStatus: DmPeerStatus;
  messages: ChatMessage[];
  messageStatuses: Record<string, DirectMessageStatus>;
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  awaitingApproval: boolean;
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onBack: () => void;
  onPressHeader: () => void;
  onPressMore: () => void;
  moreDisabled?: boolean;
}
