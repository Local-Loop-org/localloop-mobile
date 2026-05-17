import type { ChipSpec } from '@/shared/ui/FilterChip';
import type {
  DmConversation,
  DmRequest,
  InboxFilterId,
} from '../types';

export type InboxChipSpec = ChipSpec<InboxFilterId>;

export interface InboxLayoutProps {
  totalActive: number;
  unreadTotal: number;
  activeFilter: InboxFilterId;
  searchQuery: string;
  chips: InboxChipSpec[];
  conversations: DmConversation[];
  requests: DmRequest[];
  emptyLabel: string | null;
  onChangeSearch: (next: string) => void;
  onChangeFilter: (next: InboxFilterId) => void;
  onOpenDm: (dm: DmConversation) => void;
  onAcceptRequest: (id: string) => void;
  onIgnoreRequest: (id: string) => void;
  onPressEdit: () => void;
}
