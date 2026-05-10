import type { GroupDetail, JoinRequest } from '@/infra/api/groups.api';

export type JoinButtonState = 'join' | 'pending' | 'joined';

export interface GroupDetailLayoutProps {
  group: GroupDetail | null;
  loading: boolean;
  errorMessage: string | null;

  /** Join CTA state for non-members (and locally-pending users). */
  joinButtonState: JoinButtonState;
  isJoining: boolean;
  onJoin: () => void;

  onBack: () => void;

  /** True when the layout should render the admin/owner Solicitações section. */
  showModerationSection: boolean;
  pendingRequests: JoinRequest[];
  resolvingRequestId: string | null;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;

  /** Active members reach the GroupMembersScreen via either the hero chevron or the section action. */
  onPressMembers: () => void;

  /** Active members can leave; layout flips Sair from the join CTA accordingly. */
  isLeaving: boolean;
  onLeave: () => void;

  /** Owner / moderator delete affordance — `onPress` is a stub for now. */
  onPressDelete: () => void;
}
