import type { DmMockState, DmMockVariant } from '../mockData';

export interface DmChatMockupLayoutProps {
  state: DmMockState;
  variants: DmMockVariant[];
  onSelectVariant: (variant: DmMockVariant) => void;
  onCloseActionSheet: () => void;
  onPressCancelReply: () => void;
  onPressRetry: (messageId: string) => void;
  onCancelRequest: () => void;
  onSwipeReply: (messageId: string) => void;
}
