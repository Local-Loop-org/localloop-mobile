import type {
  DmConversation,
  DmRequest,
  InboxFilterId,
} from './types';

export interface InboxFilterResult {
  conversations: DmConversation[];
  requests: DmRequest[];
  emptyLabel: string | null;
}

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchesQuery(dm: DmConversation, q: string): boolean {
  if (!q) return true;
  const name = normalize(dm.peer.displayName);
  if (name.includes(q)) return true;
  if (dm.lastMessage && normalize(dm.lastMessage.content).includes(q)) return true;
  return false;
}

function matchesRequestQuery(req: DmRequest, q: string): boolean {
  if (!q) return true;
  return (
    normalize(req.peer.displayName).includes(q) ||
    normalize(req.message).includes(q)
  );
}

export function filterInbox(
  allDms: DmConversation[],
  allRequests: DmRequest[],
  activeFilter: InboxFilterId,
  searchQuery: string,
): InboxFilterResult {
  const q = normalize(searchQuery);

  if (activeFilter === 'requests') {
    const requests = allRequests.filter((r) => matchesRequestQuery(r, q));
    return {
      conversations: [],
      requests,
      emptyLabel: requests.length === 0 ? 'Sem solicitações pendentes.' : null,
    };
  }

  let pool: DmConversation[];
  let fallbackEmpty: string;
  if (activeFilter === 'archived') {
    pool = allDms.filter((d) => d.isArchived);
    fallbackEmpty = 'Nenhuma conversa arquivada.';
  } else if (activeFilter === 'unread') {
    pool = allDms.filter((d) => !d.isArchived && d.unreadCount > 0);
    fallbackEmpty = 'Nada por aqui agora.';
  } else {
    pool = allDms.filter((d) => !d.isArchived);
    fallbackEmpty = 'Nada por aqui agora.';
  }

  const conversations = pool.filter((d) => matchesQuery(d, q));
  return {
    conversations,
    requests: [],
    emptyLabel: conversations.length === 0 ? fallbackEmpty : null,
  };
}
