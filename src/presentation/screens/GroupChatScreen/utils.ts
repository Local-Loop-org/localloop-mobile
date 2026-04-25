import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ChatMessage } from '@/infra/api/messages.api';

export type ChatListItem =
  | { kind: 'message'; message: ChatMessage; key: string }
  | { kind: 'separator'; label: string; key: string };

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDayLabel(date: Date): string {
  if (isToday(date)) return '· HOJE ·';
  if (isYesterday(date)) return '· ONTEM ·';
  return `· ${format(date, 'dd/MM', { locale: ptBR }).toUpperCase()} ·`;
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/**
 * Builds the inverted FlatList feed: each day's first message (in chronological
 * order) is followed by a separator, so when the array is reversed for an
 * inverted list the separator sits visually above that day's messages.
 *
 * `messages` arrives newest-first from the hook (matches the inverted list);
 * we keep that ordering and emit a separator whenever the next-older message
 * crosses a day boundary.
 */
export function buildChatListItems(messages: ChatMessage[]): ChatListItem[] {
  if (messages.length === 0) return [];

  const items: ChatListItem[] = [];
  let lastDayKey: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const date = new Date(m.createdAt);
    const key = dayKey(date);

    if (lastDayKey !== null && key !== lastDayKey) {
      const prevDate = new Date(messages[i - 1].createdAt);
      items.push({
        kind: 'separator',
        key: `sep:${dayKey(prevDate)}`,
        label: formatDayLabel(prevDate),
      });
    }

    items.push({ kind: 'message', message: m, key: m.id });
    lastDayKey = key;
  }

  const oldest = messages[messages.length - 1];
  items.push({
    kind: 'separator',
    key: `sep:${dayKey(new Date(oldest.createdAt))}`,
    label: formatDayLabel(new Date(oldest.createdAt)),
  });

  return items;
}
