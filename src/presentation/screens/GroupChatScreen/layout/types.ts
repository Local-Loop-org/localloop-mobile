import type { AnchorType } from '@localloop/shared-types';
import type { ChatMessage } from '@/infra/api/messages.api';

export interface GroupChatLayoutProps {
  groupName: string;
  anchorType: AnchorType;
  messages: ChatMessage[];
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onBack: () => void;
  onPressHeader: () => void;
  onPressMembers: () => void;
}
