import type { ChatMessage } from '@/infra/api/messages.api';

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
