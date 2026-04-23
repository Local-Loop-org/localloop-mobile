import type { GroupMember } from '@/infra/api/groups.api';

export interface GroupMembersLayoutProps {
  members: GroupMember[];
  loading: boolean;
  errorMessage: string | null;
  banningUserId: string | null;
  canBan: (target: GroupMember) => boolean;
  onBan: (target: GroupMember) => void;
  onBack: () => void;
}
