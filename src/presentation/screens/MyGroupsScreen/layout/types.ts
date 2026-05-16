import type { AnchorType } from '@localloop/shared-types';
import type { MyGroup } from '@/infra/api/groups.api';
import type { ChipSpec } from '@/shared/ui/FilterChip';
import type { MyGroupsFilter } from '../types';

export type MyGroupsChipSpec = ChipSpec<MyGroupsFilter>;

export interface MyGroupsLayoutProps {
  groups: MyGroup[];
  total: number;
  unreadTotal: number;
  query: string;
  filter: MyGroupsFilter;
  chips: MyGroupsChipSpec[];
  loading: boolean;
  onChangeQuery: (next: string) => void;
  onChangeFilter: (next: MyGroupsFilter) => void;
  onPressGroup: (id: string) => void;
  onPressBack: () => void;
}

export type { AnchorType };
