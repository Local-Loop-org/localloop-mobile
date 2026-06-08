import type { GroupPrivacy } from '@localloop/shared-types';
import type {
  GroupDetail,
  GroupMember,
  JoinRequest,
} from '@/infra/api/groups.api';

export interface GroupEditDraft {
  name: string;
  description: string | null;
  anchorLabel: string;
  privacy: GroupPrivacy;
  radiusKm: number;
  /** Anchor position, editable via the map picker. Seeded from the group on edit start. */
  lat: number;
  lng: number;
}

export type JoinButtonState = 'join' | 'pending' | 'joined';

export interface GroupDetailLayoutProps {
  group: GroupDetail | null;
  loading: boolean;
  errorMessage: string | null;
  distanceLabel?: string | null;

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

  /** Top of the members list (up to 5 entries). Empty array falls back to a placeholder card. */
  members: GroupMember[];

  /** Active members reach the GroupMembersScreen via either the hero chevron or the section action. */
  onPressMembers: () => void;

  /** Active members can leave; layout flips Sair from the join CTA accordingly. */
  isLeaving: boolean;
  onLeave: () => void;

  /** Privileged members (owner/moderator) can ban others from the members preview. */
  onBanMember: (userId: string) => void;
  /** Owner can promote a member to moderator from the members preview. */
  onPromoteMember?: (userId: string) => void;

  /** Owner-only delete affordance. */
  isDeleting: boolean;
  onPressDelete: () => void;

  /** Inline edit mode — owners and moderators only. */
  isEditing: boolean;
  /** Non-null iff isEditing. */
  editDraft: GroupEditDraft | null;
  isSaving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: <K extends keyof GroupEditDraft>(
    field: K,
    value: GroupEditDraft[K],
  ) => void;
}
