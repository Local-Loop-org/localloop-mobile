import type { GroupMockState, GroupMockVariant } from '../mockData';

export interface GroupChatMockupLayoutProps {
  state: GroupMockState;
  variants: GroupMockVariant[];
  onSelectVariant: (variant: GroupMockVariant) => void;
  onCloseActionSheet: () => void;
  onPressCancelReply: () => void;
  onPressRetry: (messageId: string) => void;
  onSwipeReply: (messageId: string) => void;
}
