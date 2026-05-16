import React, { useMemo, useState } from 'react';
import InboxLayout from './layout';
import type { InboxChipSpec } from './layout/types';
import { MOCK_DMS, MOCK_REQUESTS } from './data';
import { filterInbox } from './filter';
import type { InboxFilterId } from './types';

export default function InboxScreen() {
  const [activeFilter, setActiveFilter] = useState<InboxFilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totals = useMemo(() => {
    const active = MOCK_DMS.filter((d) => !d.isArchived);
    const unread = active.filter((d) => d.unreadCount > 0).length;
    const archived = MOCK_DMS.length - active.length;
    return {
      active: active.length,
      unread,
      archived,
      requests: MOCK_REQUESTS.length,
    };
  }, []);

  const chips = useMemo<InboxChipSpec[]>(
    () => [
      { id: 'all', label: 'Todas', count: totals.active },
      { id: 'unread', label: 'Não lidas', count: totals.unread, dot: true },
      {
        id: 'requests',
        label: 'Solicitações',
        count: totals.requests,
        icon: 'bell',
      },
      {
        id: 'archived',
        label: 'Arquivadas',
        count: totals.archived,
        icon: 'shield',
      },
    ],
    [totals],
  );

  const { conversations, requests, emptyLabel } = useMemo(
    () => filterInbox(MOCK_DMS, MOCK_REQUESTS, activeFilter, searchQuery),
    [activeFilter, searchQuery],
  );

  // TODO(phase-4): wire to DM chat screen + accept/ignore mutations once DM API ships.
  const noop = () => {};

  return (
    <InboxLayout
      totalActive={totals.active}
      unreadTotal={totals.unread}
      activeFilter={activeFilter}
      searchQuery={searchQuery}
      chips={chips}
      conversations={conversations}
      requests={requests}
      emptyLabel={emptyLabel}
      onChangeSearch={setSearchQuery}
      onChangeFilter={setActiveFilter}
      onOpenDm={noop}
      onAcceptRequest={noop}
      onIgnoreRequest={noop}
      onPressEdit={noop}
    />
  );
}
