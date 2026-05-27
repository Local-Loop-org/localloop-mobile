import type { InfiniteData } from '@tanstack/react-query';
import type { DirectMessageHistoryResponse } from '@localloop/shared-types';
import { dmApi } from '@/infra/api/dm.api';

export const dmHistoryKey = (peerId: string) =>
  ['dm', 'history', peerId] as const;

export type DmHistoryInfiniteData =
  InfiniteData<DirectMessageHistoryResponse>;

export function fetchDmHistoryPage(
  peerId: string,
  before: string | undefined,
): Promise<DirectMessageHistoryResponse> {
  return dmApi.getDmHistory(peerId, before ? { before } : {});
}

export function getNextDmHistoryPageParam(
  last: DirectMessageHistoryResponse,
): string | undefined {
  return last.next_cursor ?? undefined;
}

function isFreshWatermark(
  next: string,
  current: string | null | undefined,
): boolean {
  if (!current) return true;

  const nextTime = new Date(next).getTime();
  const currentTime = new Date(current).getTime();

  if (Number.isNaN(nextTime) || Number.isNaN(currentTime)) {
    return next > current;
  }

  return nextTime > currentTime;
}

export function setDmHistoryWatermark(
  old: DmHistoryInfiniteData | undefined,
  field: 'lastReadAt' | 'peerLastReadAt',
  lastReadAt: string,
): DmHistoryInfiniteData | undefined {
  if (!old) return old;

  const current = old.pages[0]?.[field] ?? null;
  if (!isFreshWatermark(lastReadAt, current)) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      [field]: lastReadAt,
    })),
  };
}
