import { filterInbox } from './filter';
import type { DmConversation, DmRequest } from './types';

const dm = (overrides: Partial<DmConversation>): DmConversation => ({
  id: overrides.id ?? 'x',
  peer: overrides.peer ?? {
    id: 'p',
    displayName: 'Pessoa',
    avatarUrl: null,
  },
  lastMessage: overrides.lastMessage ?? {
    content: 'oi',
    createdAt: '2026-05-16T00:00:00.000Z',
    fromMe: false,
  },
  unreadCount: overrides.unreadCount ?? 0,
  isArchived: overrides.isArchived ?? false,
});

const req = (overrides: Partial<DmRequest>): DmRequest => ({
  id: overrides.id ?? 'rx',
  peer: overrides.peer ?? {
    id: 'rp',
    displayName: 'Solicitante',
    avatarUrl: null,
  },
  message: overrides.message ?? 'oi',
  createdAt: overrides.createdAt ?? '2026-05-16T00:00:00.000Z',
});

describe('filterInbox', () => {
  const ana = dm({
    id: 'ana',
    peer: { id: 'p1', displayName: 'Ana Beatriz', avatarUrl: null },
    lastMessage: { content: 'Levo água extra', createdAt: 't', fromMe: false },
    unreadCount: 3,
  });
  const rafa = dm({
    id: 'rafa',
    peer: { id: 'p2', displayName: 'Rafael Souza', avatarUrl: null },
    lastMessage: { content: 'vejo depois', createdAt: 't', fromMe: true },
  });
  const archived = dm({ id: 'arch', isArchived: true });
  const dms = [ana, rafa, archived];

  const requests = [
    req({ id: 'r1', peer: { id: 'p9', displayName: 'Helena', avatarUrl: null }, message: 'oi vizinha' }),
  ];

  describe('all filter', () => {
    it('returns active dms only and an empty requests array', () => {
      const r = filterInbox(dms, requests, 'all', '');
      expect(r.conversations.map((d) => d.id)).toEqual(['ana', 'rafa']);
      expect(r.requests).toEqual([]);
      expect(r.emptyLabel).toBeNull();
    });

    it('matches case- and diacritic-insensitive on peer name', () => {
      const r = filterInbox(dms, requests, 'all', 'aná');
      expect(r.conversations.map((d) => d.id)).toEqual(['ana']);
    });

    it('matches on last message content', () => {
      const r = filterInbox(dms, requests, 'all', 'agua');
      expect(r.conversations.map((d) => d.id)).toEqual(['ana']);
    });

    it('returns an empty-state label when nothing matches', () => {
      const r = filterInbox(dms, requests, 'all', 'zzzz');
      expect(r.conversations).toEqual([]);
      expect(r.emptyLabel).toBe('Nada por aqui agora.');
    });
  });

  describe('unread filter', () => {
    it('returns only conversations with unreadCount > 0', () => {
      const r = filterInbox(dms, requests, 'unread', '');
      expect(r.conversations.map((d) => d.id)).toEqual(['ana']);
    });

    it('still respects search query', () => {
      const r = filterInbox(dms, requests, 'unread', 'zzz');
      expect(r.conversations).toEqual([]);
      expect(r.emptyLabel).toBe('Nada por aqui agora.');
    });
  });

  describe('requests filter', () => {
    it('returns the request list and ignores conversations', () => {
      const r = filterInbox(dms, requests, 'requests', '');
      expect(r.conversations).toEqual([]);
      expect(r.requests.map((q) => q.id)).toEqual(['r1']);
      expect(r.emptyLabel).toBeNull();
    });

    it('matches search against peer name and message', () => {
      const r1 = filterInbox(dms, requests, 'requests', 'helena');
      expect(r1.requests).toHaveLength(1);
      const r2 = filterInbox(dms, requests, 'requests', 'vizinha');
      expect(r2.requests).toHaveLength(1);
      const r3 = filterInbox(dms, requests, 'requests', 'rafa');
      expect(r3.requests).toEqual([]);
      expect(r3.emptyLabel).toBe('Sem solicitações pendentes.');
    });

    it('returns the empty label when no requests exist', () => {
      const r = filterInbox(dms, [], 'requests', '');
      expect(r.emptyLabel).toBe('Sem solicitações pendentes.');
    });
  });

  describe('archived filter', () => {
    it('returns only archived conversations', () => {
      const r = filterInbox(dms, requests, 'archived', '');
      expect(r.conversations.map((d) => d.id)).toEqual(['arch']);
    });

    it('returns the archived empty label when none exist', () => {
      const r = filterInbox([ana, rafa], requests, 'archived', '');
      expect(r.conversations).toEqual([]);
      expect(r.emptyLabel).toBe('Nenhuma conversa arquivada.');
    });
  });
});
