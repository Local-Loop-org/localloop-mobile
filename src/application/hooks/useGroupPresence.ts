import { useEffect, useMemo, useState } from 'react';
import type { PresenceUpdate } from '@localloop/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/application/stores/auth.store';
import type { GroupSummaryUpdate } from '@/infra/api/groups.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { applyGroupSummaryUpdate } from './useMyGroups';

export type PresenceCountMap = Record<string, number>;

const MAX_WATCHED_GROUPS = 50;

function normalizeGroupIds(groupIds: string[]): string[] {
  return [...new Set(groupIds)]
    .filter((id) => id.length > 0)
    .sort()
    .slice(0, MAX_WATCHED_GROUPS);
}

/**
 * Watches chat-room presence without joining counted chat rooms. Counts are
 * emitted by the `/chat` namespace through the same `presence_update` event
 * used by chat, but this hook only joins read-only presence observer rooms.
 */
export function useGroupPresence(groupIds: string[]): PresenceCountMap {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const watchKey = normalizeGroupIds(groupIds).join('|');
  const watchedIds = useMemo(
    () => (watchKey.length > 0 ? watchKey.split('|') : []),
    [watchKey],
  );
  const [counts, setCounts] = useState<PresenceCountMap>({});

  useEffect(() => {
    if (!accessToken || watchedIds.length === 0) {
      setCounts({});
      return;
    }

    const watched = new Set(watchedIds);
    setCounts((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([groupId]) => watched.has(groupId)),
      ),
    );

    const socket = createChatSocket(accessToken);

    socket.on('connect', () => {
      socket.emit('watch_presence', { groupIds: watchedIds });
      socket.emit('watch_group_summaries', { groupIds: watchedIds });
    });
    socket.on('presence_update', (payload: PresenceUpdate) => {
      if (!watched.has(payload.groupId)) return;
      setCounts((prev) => ({ ...prev, [payload.groupId]: payload.count }));
    });
    socket.on('group_summary_update', (payload: GroupSummaryUpdate) => {
      if (!watched.has(payload.groupId)) return;
      applyGroupSummaryUpdate(queryClient, payload);
    });
    socket.on('error', (payload: { code?: string; message?: string }) => {
      // eslint-disable-next-line no-console
      console.warn('[presence] socket error', payload);
    });

    return () => {
      socket.emit('unwatch_presence', { groupIds: watchedIds });
      socket.emit('unwatch_group_summaries', { groupIds: watchedIds });
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [accessToken, queryClient, watchKey, watchedIds]);

  return counts;
}
