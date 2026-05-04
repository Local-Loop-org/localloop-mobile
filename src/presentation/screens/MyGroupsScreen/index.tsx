import React, { useMemo, useState } from 'react';
import { AnchorType } from '@localloop/shared-types';
import { useMyGroups } from '@/application/hooks/useMyGroups';
import { ANCHOR_SECTION_LABELS } from '@/shared/anchor/labels';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import MyGroupsLayout from './layout';
import type { ChipSpec } from './layout/types';
import type { MyGroupsFilter } from './types';

type Props = AuthenticatedStackScreenProps<'MyGroups'>;

const ANCHOR_DISPLAY_ORDER: AnchorType[] = [
  AnchorType.ESTABLISHMENT,
  AnchorType.EVENT,
  AnchorType.CONDO,
  AnchorType.NEIGHBORHOOD,
  AnchorType.CITY,
];

export default function MyGroupsScreen({ navigation }: Props) {
  const myGroupsQuery = useMyGroups(50);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MyGroupsFilter>('all');

  const groups = myGroupsQuery.data ?? [];

  const totals = useMemo(() => {
    const byType = new Map<AnchorType, number>();
    let unread = 0;
    for (const g of groups) {
      byType.set(g.anchorType, (byType.get(g.anchorType) ?? 0) + 1);
      if ((g.unreadCount ?? 0) > 0) unread += 1;
    }
    return { total: groups.length, unread, byType };
  }, [groups]);

  const chips = useMemo<ChipSpec[]>(() => {
    const list: ChipSpec[] = [
      { id: 'all', label: 'Todos', count: totals.total },
    ];
    if (totals.unread > 0) {
      list.push({
        id: 'unread',
        label: 'Não lidas',
        count: totals.unread,
        dot: true,
      });
    }
    for (const type of ANCHOR_DISPLAY_ORDER) {
      const count = totals.byType.get(type) ?? 0;
      if (count === 0) continue;
      list.push({
        id: type,
        label: ANCHOR_SECTION_LABELS[type],
        count,
        icon: anchorIconName(type),
      });
    }
    return list;
  }, [totals]);

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    return groups.filter((g) => {
      const passesFilter =
        filter === 'all'
          ? true
          : filter === 'unread'
            ? (g.unreadCount ?? 0) > 0
            : g.anchorType === filter;
      if (!passesFilter) return false;
      if (!q) return true;
      return g.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(q);
    });
  }, [groups, query, filter]);

  return (
    <MyGroupsLayout
      groups={filtered}
      total={totals.total}
      unreadTotal={totals.unread}
      query={query}
      filter={filter}
      chips={chips}
      loading={myGroupsQuery.isLoading}
      onChangeQuery={setQuery}
      onChangeFilter={setFilter}
      onPressGroup={(id) => {
        const group = groups.find((g) => g.id === id);
        if (!group) return;
        navigation.navigate('GroupChat', {
          groupId: id,
          groupName: group.name,
          anchorType: group.anchorType,
          myRole: group.myRole,
        });
      }}
      onPressBack={() => navigation.goBack()}
    />
  );
}
