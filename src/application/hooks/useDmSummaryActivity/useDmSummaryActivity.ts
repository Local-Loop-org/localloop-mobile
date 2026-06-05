import { useEffect, useState } from 'react';
import { ChatSocketEvents, type DmSummaryUpdate } from '@localloop/shared-types';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';

function isFreshActivityAt(next: string, current: string | null): boolean {
  if (!current) return true;

  const nextTime = new Date(next).getTime();
  const currentTime = new Date(current).getTime();

  if (Number.isNaN(nextTime) || Number.isNaN(currentTime)) {
    return next > current;
  }

  return nextTime > currentTime;
}

export function useDmSummaryActivity(peerId: string): string | null {
  const manager = useChatSocketManager();
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);

  useEffect(() => {
    setLastActivityAt(null);
    if (peerId.length === 0) return;

    const handleSummaryUpdate = (payload: DmSummaryUpdate) => {
      if (payload.peerId !== peerId) return;
      if (typeof payload.lastActivityAt !== 'string') return;

      setLastActivityAt((current) =>
        isFreshActivityAt(payload.lastActivityAt, current)
          ? payload.lastActivityAt
          : current,
      );
    };

    const offSummary = manager.addListener<DmSummaryUpdate>(
      ChatSocketEvents.DM_SUMMARY_UPDATE,
      handleSummaryUpdate,
    );

    const offSubscription = manager.subscribe({
      key: 'dm:inbox',
      subscribe: () => {
        manager.emit(ChatSocketEvents.WATCH_DM_INBOX, {});
      },
      unsubscribe: () => {
        manager.emit(ChatSocketEvents.UNWATCH_DM_INBOX, {});
      },
    });

    return () => {
      offSummary();
      offSubscription();
    };
  }, [manager, peerId]);

  return lastActivityAt;
}
