import type { ChatMessage, DirectMessageStatus } from '@localloop/shared-types';
import type {
  ChatComposerEditState,
  ChatComposerReplyTo,
} from '@/shared/ui/chat/ChatComposer';
import type { DmActionId } from '@/shared/ui/chat/DmActionSheet';
import type { MessageActionId } from '@/shared/ui/chat/MessageActionSheet';
import type { AvailableMessageActions } from '@/shared/ui/chat/messageActionPolicy';

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
  onBack: () => void;
  onPressHeader: () => void;
  onPressMore: () => void;
  onCloseActionSheet: () => void;
  /** Dispatched when the user taps an item in the action sheet. */
  onSelectAction: (action: DmActionId) => void;
  /** Dispatched when the user cancels a pending DM approval. */
  onCancelRequest: () => void;
  moreDisabled?: boolean;
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
