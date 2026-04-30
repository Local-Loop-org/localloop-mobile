import type { MyGroup, NearbyGroup } from '@/infra/api/groups.api';

export interface HomeLayoutProps {
  groups: NearbyGroup[];
  loading: boolean;
  refreshing: boolean;
  /** User-facing error message when the fetch fails. Null when OK. */
  errorMessage: string | null;
  onRefresh: () => void;
  onPressGroup: (id: string) => void;
  onPressCreate: () => void;
  onPressMore: () => void;
  myGroups: MyGroup[];
  myGroupsLoading: boolean;
  onPressMyGroup: (id: string) => void;
}
