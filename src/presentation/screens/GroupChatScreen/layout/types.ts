import type { AnchorType, GroupMessage } from '@localloop/shared-types';

export interface GroupChatLayoutProps {
  groupName: string;
  anchorType: AnchorType;
  onlineCount: number;
  messages: GroupMessage[];
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onPressMessageAvatar: (message: GroupMessage) => void;
  onBack: () => void;
  onPressHeader: () => void;
  onPressMembers: () => void;
}
