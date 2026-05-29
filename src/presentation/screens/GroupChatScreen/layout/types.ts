import type { AnchorType, GroupMessage } from '@localloop/shared-types';
import type { GroupActionId } from '@/shared/ui/chat/GroupActionSheet';
import type { MessageActionId } from '@/shared/ui/chat/MessageActionSheet';
import type { AvailableMessageActions } from '@/shared/ui/chat/messageActionPolicy';

export interface GroupChatLayoutProps {
  groupName: string;
  anchorType: AnchorType;
  onlineCount: number;
  /** Optional — when omitted, the action sheet subtitle hides the member prefix. */
  memberCount?: number;
  messages: GroupMessage[];
  /** Per-message send status for own bubbles, keyed by message id.
   * 'sending' while the optimistic temp is in flight; 'sent' after the server
   * echo replaces it. Peer messages are absent. */
  messageStatuses: Record<string, 'sending' | 'sent'>;
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  draft: string;
  /** Whether the bottom action sheet is currently shown. */
  actionSheetOpen: boolean;
  /** The per-message action sheet renders when this is non-null. */
  messageActionSheet: {
    messagePreview: string;
    available: AvailableMessageActions;
  } | null;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onPressMessageAvatar: (message: GroupMessage) => void;
  onBack: () => void;
  onPressHeader: () => void;
  onPressMore: () => void;
  onCloseActionSheet: () => void;
  /** Dispatched when the user taps an item in the action sheet. */
  onSelectAction: (action: GroupActionId) => void;
  /** Long-press on a chat bubble — the screen decides whether to open the
   * per-message action sheet based on the policy. */
  onLongPressMessage: (messageId: string) => void;
  /** Dispatched when the user taps an item in the per-message action sheet. */
  onSelectMessageAction: (action: MessageActionId) => void;
  /** Dispatched when the per-message action sheet is dismissed. */
  onCloseMessageActionSheet: () => void;
}
