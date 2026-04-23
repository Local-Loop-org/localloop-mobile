import type { GroupDetail, JoinRequest } from '@/infra/api/groups.api';

export type JoinButtonState = 'join' | 'pending' | 'joined';

export interface GroupDetailLayoutProps {
  group: GroupDetail | null;
  loading: boolean;
  errorMessage: string | null;
  joinButtonState: JoinButtonState;
  isJoining: boolean;
  onJoin: () => void;
  onBack: () => void;

  showModerationSection: boolean;
  pendingRequests: JoinRequest[];
  resolvingRequestId: string | null;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;

  showMembersButton: boolean;
  onPressMembers: () => void;

  showLeaveButton: boolean;
  isOwner: boolean;
  isLeaving: boolean;
  onLeave: () => void;
}
