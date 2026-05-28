import type { ChatMessage, DirectMessageStatus } from '@localloop/shared-types';
import type { DmActionId } from '@/shared/ui/chat/DmActionSheet';

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
  archived: boolean;
  draft: string;
  /** Whether the bottom action sheet is currently shown. */
  actionSheetOpen: boolean;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onBack: () => void;
  onPressHeader: () => void;
  onPressMore: () => void;
  onCloseActionSheet: () => void;
  /** Dispatched when the user taps an item in the action sheet. */
  onSelectAction: (action: DmActionId) => void;
  /** Dispatched when the user cancels a pending DM approval. */
  onCancelRequest: () => void;
  moreDisabled?: boolean;
}
