import type { ChatMessage } from '@/infra/api/messages.api';

export interface GroupChatLayoutProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  connected: boolean;
  errorMessage: string | null;
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onLoadOlder: () => void;
  onBack: () => void;
}
