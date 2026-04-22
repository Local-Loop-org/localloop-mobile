import type { GroupDetail } from '@/infra/api/groups.api';

export type JoinButtonState = 'join' | 'pending' | 'joined';

export interface GroupDetailLayoutProps {
  group: GroupDetail | null;
  loading: boolean;
  errorMessage: string | null;
  joinButtonState: JoinButtonState;
  isJoining: boolean;
  onJoin: () => void;
  onBack: () => void;
}
