import type { ChatSendStatus } from '@/shared/chat/sendStatus';
import type {
  ChatComposerEditState,
  ChatComposerReplyTo,
} from '@/shared/ui/chat/ChatComposer';
import type { GroupActionId } from '@/shared/ui/chat/GroupActionSheet';
import type { MessageActionId } from '@/shared/ui/chat/MessageActionSheet';
import type { AvailableMessageActions } from '@/shared/ui/chat/messageActionPolicy';
import type { AnchorType, GroupMessage } from '@localloop/shared-types';

export interface GroupChatLayoutProps {
  groupName: string;
  anchorType: AnchorType;
  onlineCount: number;
  /** Optional — when omitted, the action sheet subtitle hides the member prefix. */
  memberCount?: number;
  messages: GroupMessage[];
  /** Per-message send status for own bubbles, keyed by message id.
   * 'sending' while the optimistic temp is in flight, 'error' when a later
   * Cluster E step marks the temp failed, and 'sent' after the server echo
   * replaces it. Peer messages are absent. */
  messageStatuses: Record<string, ChatSendStatus>;
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  draft: string;
  /** When set, the composer renders a reply preview chip above the input. */
  composingReplyTo: ChatComposerReplyTo | null;
  /** When set, the composer renders an edit preview chip above the input. */
  composingEdit: ChatComposerEditState | null;
  /** Inline error banner above the composer, dismissable. */
  editError: string | null;
  onDismissEditError: () => void;
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
  /** Horizontal swipe on a chat bubble — opens the reply composer for that
   * message, same flow as the action-sheet "Responder" entry. */
  onSwipeReply: (messageId: string) => void;
  /** Dispatched when the user taps an item in the per-message action sheet. */
  onSelectMessageAction: (action: MessageActionId) => void;
  /** Dispatched when the per-message action sheet is dismissed. */
  onCloseMessageActionSheet: () => void;
}
