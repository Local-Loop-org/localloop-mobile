import type { MemberRole } from '@localloop/shared-types';
import type {
  GroupMember,
  JoinRequest,
} from '@/infra/api/groups.api';
import type { BannedMember } from './components/BannedMemberRow';

export type FilterChipKey = 'all' | 'active' | 'pending' | 'banned';

export interface GroupMembersLayoutProps {
  /** Group name shown as subtitle under the header title. */
  groupName?: string | null;
  /** Caller's role; null when not a member (treated as read-only). */
  myRole: MemberRole | null;
  /** True when caller is OWNER or MODERATOR. */
  canManage: boolean;
  /** Current signed-in user id, used to avoid opening a self-DM row. */
  currentUserId: string | null;

  activeMembers: GroupMember[];
  pendingRequests: JoinRequest[];
  bannedMembers: BannedMember[];

  loadingActive: boolean;
  loadingPending: boolean;
  loadingBanned: boolean;
  errorMessage: string | null;

  query: string;
  onQueryChange: (next: string) => void;
  filter: FilterChipKey;
  onFilterChange: (next: FilterChipKey) => void;

  /** Currently-pending mutation user IDs (drives row spinners + disabled state). */
  banningUserId: string | null;
  unbanningUserId: string | null;
  resolvingRequestId: string | null;

  onPressMember: (member: GroupMember) => void;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onBack: () => void;
}
