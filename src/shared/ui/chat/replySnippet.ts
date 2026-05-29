const MAX_LENGTH = 120;
const TRUNCATE_AT = 117;

export function truncateReplySnippet(content: string | null): string | null {
  if (content === null) return null;
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return null;
  if (normalized.length <= MAX_LENGTH) return normalized;
  return normalized.slice(0, TRUNCATE_AT).trimEnd() + '…';
}
