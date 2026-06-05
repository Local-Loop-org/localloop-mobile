import {
  format,
  isSameDay,
  isSameYear,
  isToday,
  isYesterday,
  isValid,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ChatMessage } from '@localloop/shared-types';

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

export function formatLastSeen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (!isValid(d)) return '';

  const time = format(d, 'HH:mm');
  if (isSameDay(d, now)) return `Visto às ${time}`;
  if (isSameDay(d, subDays(now, 1))) return `Visto ontem às ${time}`;

  const datePattern = isSameYear(d, now) ? 'dd/MM' : 'dd/MM/yyyy';
  return `Visto ${format(d, datePattern)} às ${time}`;
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
