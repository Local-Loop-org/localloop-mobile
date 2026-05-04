import { format } from 'date-fns';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatLastActivity(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const diff = now - then;

  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 2 * DAY) return 'ontem';
  return format(new Date(iso), 'dd/MM');
}
