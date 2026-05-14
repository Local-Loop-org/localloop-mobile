import { useEffect, useMemo, useState } from 'react';
import type { PresenceUpdate } from '@localloop/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/application/stores/auth.store';
import type { GroupSummaryUpdate } from '@/infra/api/groups.api';
import { createChatSocket } from '@/infra/socket/chat-socket';
import { applyGroupSummaryUpdate } from '../useMyGroups/useMyGroups';

export type PresenceCountMap = Record<string, number>;

const MAX_WATCHED_GROUPS = 50;

interface UseGroupListRealtimeOptions {
  presenceGroupIds: string[];
  summaryGroupIds?: string[];
  enabled?: boolean;
}

function normalizeGroupIds(groupIds: string[]): string[] {
  return [...new Set(groupIds)]
    .filter((id) => id.length > 0)
    .sort()
    .slice(0, MAX_WATCHED_GROUPS);
}

/**
 * Watches list-only realtime data without joining counted chat rooms.
 * Presence and summaries can be watched independently while sharing one
 * short-lived socket for the focused list screen.
 */
export function useGroupListRealtime({
  presenceGroupIds,
  summaryGroupIds = [],
  enabled = true,
}: UseGroupListRealtimeOptions): PresenceCountMap {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const presenceKey = normalizeGroupIds(presenceGroupIds).join('|');
  const summaryKey = normalizeGroupIds(summaryGroupIds).join('|');
  const watchedPresenceIds = useMemo(
    () => (presenceKey.length > 0 ? presenceKey.split('|') : []),
    [presenceKey],
  );
  const watchedSummaryIds = useMemo(
    () => (summaryKey.length > 0 ? summaryKey.split('|') : []),
    [summaryKey],
  );
  const [counts, setCounts] = useState<PresenceCountMap>({});

  useEffect(() => {
    if (
      !enabled ||
      !accessToken ||
      (watchedPresenceIds.length === 0 && watchedSummaryIds.length === 0)
    ) {
      setCounts({});
      return;
    }

    const watchedPresence = new Set(watchedPresenceIds);
    const watchedSummaries = new Set(watchedSummaryIds);
    setCounts((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([groupId]) =>
          watchedPresence.has(groupId),
        ),
      ),
    );

    const socket = createChatSocket(accessToken);

    const handleConnect = () => {
      if (watchedPresenceIds.length > 0) {
        socket.emit('watch_presence', { groupIds: watchedPresenceIds });
      }
      if (watchedSummaryIds.length > 0) {
        socket.emit('watch_group_summaries', { groupIds: watchedSummaryIds });
      }
    };

    const handlePresenceUpdate = (payload: PresenceUpdate) => {
      if (!watchedPresence.has(payload.groupId)) return;
      setCounts((prev) => ({ ...prev, [payload.groupId]: payload.count }));
    };

    const handleGroupSummaryUpdate = (payload: GroupSummaryUpdate) => {
      if (!watchedSummaries.has(payload.groupId)) return;
      applyGroupSummaryUpdate(queryClient, payload);
    };

    const handleSocketError = (payload: { code?: string; message?: string }) => {
      // eslint-disable-next-line no-console
      console.warn('[group-list-realtime] socket error', payload);
    };

    socket.on('connect', handleConnect);
    socket.on('presence_update', handlePresenceUpdate);
    socket.on('group_summary_update', handleGroupSummaryUpdate);
    socket.on('error', handleSocketError);

    return () => {
      if (watchedPresenceIds.length > 0) {
        socket.emit('unwatch_presence', { groupIds: watchedPresenceIds });
      }
      if (watchedSummaryIds.length > 0) {
        socket.emit('unwatch_group_summaries', { groupIds: watchedSummaryIds });
      }
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [
    accessToken,
    enabled,
    queryClient,
    presenceKey,
    summaryKey,
    watchedPresenceIds,
    watchedSummaryIds,
  ]);

  return counts;
}
