import type { AnchorType } from '@localloop/shared-types';
import type { MyGroup } from '@/infra/api/groups.api';
import type { IconName } from '@/shared/icons';
import type { MyGroupsFilter } from '../types';

export interface ChipSpec {
  id: MyGroupsFilter;
  label: string;
  count: number;
  icon?: IconName;
  dot?: boolean;
}

export interface MyGroupsLayoutProps {
  groups: MyGroup[];
  total: number;
  unreadTotal: number;
  query: string;
  filter: MyGroupsFilter;
  chips: ChipSpec[];
  loading: boolean;
  onChangeQuery: (next: string) => void;
  onChangeFilter: (next: MyGroupsFilter) => void;
  onPressGroup: (id: string) => void;
  onPressBack: () => void;
}

export type { AnchorType };
