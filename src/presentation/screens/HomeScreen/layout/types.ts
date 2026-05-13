import type { HomeMyGroup, HomeNearbyGroup } from '../types';

export interface HomeLayoutProps {
  groups: HomeNearbyGroup[];
  loading: boolean;
  refreshing: boolean;
  /** User-facing error message when the fetch fails. Null when OK. */
  errorMessage: string | null;
  onRefresh: () => void;
  onPressGroup: (id: string) => void;
  myGroups: HomeMyGroup[];
  myGroupsLoading: boolean;
  onPressMyGroup: (id: string) => void;
  onPressViewAllMyGroups: () => void;
}
