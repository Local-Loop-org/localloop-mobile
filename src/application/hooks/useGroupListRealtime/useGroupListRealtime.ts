import { useEffect, useMemo, useState } from 'react';
import { ChatSocketEvents, type PresenceUpdate } from '@localloop/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import type { GroupSummaryUpdate } from '@/infra/api/groups.api';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';
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
 * Watches list-only realtime data without joining counted chat rooms. Uses the
 * app-level chat socket via the manager; presence and summaries can be watched
 * independently and are ref-counted so concurrent screens dedupe.
 */
export function useGroupListRealtime({
  presenceGroupIds,
  summaryGroupIds = [],
  enabled = true,
}: UseGroupListRealtimeOptions): PresenceCountMap {
  const queryClient = useQueryClient();
  const manager = useChatSocketManager();
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

    const handlePresenceUpdate = (payload: PresenceUpdate) => {
      if (!watchedPresence.has(payload.groupId)) return;
      setCounts((prev) => ({ ...prev, [payload.groupId]: payload.count }));
    };

    const handleGroupSummaryUpdate = (payload: GroupSummaryUpdate) => {
      if (!watchedSummaries.has(payload.groupId)) return;
      applyGroupSummaryUpdate(queryClient, payload);
    };

    const handleSocketError = (payload: {
      code?: string;
      message?: string;
    }) => {
      // eslint-disable-next-line no-console
      console.warn('[group-list-realtime] socket error', payload);
    };

    const offPresence = manager.addListener<PresenceUpdate>(
      ChatSocketEvents.PRESENCE_UPDATE,
      handlePresenceUpdate,
    );
    const offSummary = manager.addListener<GroupSummaryUpdate>(
      ChatSocketEvents.GROUP_SUMMARY_UPDATE,
      handleGroupSummaryUpdate,
    );
    const offError = manager.addListener<{
      code?: string;
      message?: string;
    }>(ChatSocketEvents.ERROR, handleSocketError);

    const offPresenceSub =
      watchedPresenceIds.length > 0
        ? manager.subscribe({
            key: `group:presence:${watchedPresenceIds.join('|')}`,
            subscribe: () => {
              manager.emit(ChatSocketEvents.WATCH_PRESENCE, {
                groupIds: watchedPresenceIds,
              });
            },
            unsubscribe: () => {
              manager.emit(ChatSocketEvents.UNWATCH_PRESENCE, {
                groupIds: watchedPresenceIds,
              });
            },
          })
        : () => {};

    const offSummariesSub =
      watchedSummaryIds.length > 0
        ? manager.subscribe({
            key: `group:summary:${watchedSummaryIds.join('|')}`,
            subscribe: () => {
              manager.emit(ChatSocketEvents.WATCH_GROUP_SUMMARIES, {
                groupIds: watchedSummaryIds,
              });
            },
            unsubscribe: () => {
              manager.emit(ChatSocketEvents.UNWATCH_GROUP_SUMMARIES, {
                groupIds: watchedSummaryIds,
              });
            },
          })
        : () => {};

    return () => {
      offPresence();
      offSummary();
      offError();
      offPresenceSub();
      offSummariesSub();
    };
  }, [
    manager,
    enabled,
    queryClient,
    presenceKey,
    summaryKey,
    watchedPresenceIds,
    watchedSummaryIds,
  ]);

  return counts;
}
