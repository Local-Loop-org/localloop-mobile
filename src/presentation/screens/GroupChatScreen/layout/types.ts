import type { AnchorType, GroupMessage } from '@localloop/shared-types';
import type { GroupActionId } from '@/shared/ui/chat/GroupActionSheet';

export interface GroupChatLayoutProps {
  groupName: string;
  anchorType: AnchorType;
  onlineCount: number;
  /** Optional — when omitted, the action sheet subtitle hides the member prefix. */
  memberCount?: number;
  messages: GroupMessage[];
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  draft: string;
  /** Whether the bottom action sheet is currently shown. */
  actionSheetOpen: boolean;
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
}
