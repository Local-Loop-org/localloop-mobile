import type { NearbyGroup } from '@/infra/api/groups.api';

export interface GroupDiscoveryLayoutProps {
  groups: NearbyGroup[];
  loading: boolean;
  refreshing: boolean;
  /** User-facing error message when the fetch fails. Null when OK. */
  errorMessage: string | null;
  onRefresh: () => void;
  onPressGroup: (id: string) => void;
  onPressCreate: () => void;
  onLogout: () => void;
}
