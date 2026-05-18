import { format, isToday, isYesterday, isValid } from 'date-fns';
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
  const d = new Date(iso);
  if (!isValid(d)) return '';
  return format(d, 'HH:mm');
}

export function buildChatListItems(messages: ChatMessage[]): ChatListItem[] {
  if (messages.length === 0) return [];

  const items: ChatListItem[] = [];
  let lastDayKey: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const date = new Date(m.createdAt);

    if (isValid(date)) {
      const key = dayKey(date);
      if (lastDayKey !== null && key !== lastDayKey) {
        const prevDate = new Date(messages[i - 1].createdAt);
        if (isValid(prevDate)) {
          items.push({
            kind: 'separator',
            key: `sep:${dayKey(prevDate)}`,
            label: formatDayLabel(prevDate),
          });
        }
      }
      lastDayKey = key;
    }

    items.push({ kind: 'message', message: m, key: m.id });
  }

  const oldest = messages[messages.length - 1];
  const oldestDate = new Date(oldest.createdAt);
  if (isValid(oldestDate)) {
    items.push({
      kind: 'separator',
      key: `sep:${dayKey(oldestDate)}`,
      label: formatDayLabel(oldestDate),
    });
  }

  return items;
}
