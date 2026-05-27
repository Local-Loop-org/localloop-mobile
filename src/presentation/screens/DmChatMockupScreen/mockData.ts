import type { ChatMessage } from '@localloop/shared-types';
import type { OwnBubbleStatus } from '@/shared/ui/chat/OwnBubble';

export type DmMockVariant =
  | 'online'
  | 'lastSeen'
  | 'typing'
  | 'menu'
  | 'request'
  | 'replying'
  | 'failed';

export interface DmMockPeer {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export type DmMockPresence =
  | { kind: 'online' }
  | { kind: 'typing' }
  | { kind: 'lastSeen'; label: string }
  | { kind: 'pendingApproval' };

export interface DmMockState {
  variant: DmMockVariant;
  peer: DmMockPeer;
  presence: DmMockPresence;
  messages: ChatMessage[];
  /** Per-message status, only used for own messages. */
  messageStatuses: Record<string, OwnBubbleStatus>;
  /** Per-message replyTo mapping (id of original) so the bubble can render the quoted block. */
  messageReplyTo: Record<string, string>;
  /** Show the typing bubble at the bottom of the thread. */
  showTypingBubble: boolean;
  /** Show the request banner + locked composer. */
  awaitingApproval: boolean;
  /** Show the action sheet on top of the screen. */
  actionSheetOpen: boolean;
  /** When set, a reply preview chip + draft text appear above the composer. */
  composingReplyTo: string | null;
  composingDraft: string;
}

export const ME: DmMockPeer = {
  id: 'you-1',
  name: 'Você',
  avatarUrl: null,
};

export const PEER: DmMockPeer = {
  id: 'peer-1',
  name: 'Ana Beatriz',
  avatarUrl: null,
};

function msg(
  id: string,
  fromPeer: boolean,
  content: string,
  isoTime: string,
): ChatMessage {
  const author = fromPeer ? PEER : ME;
  return {
    id,
    senderId: author.id,
    senderName: author.name,
    senderAvatarUrl: author.avatarUrl,
    content,
    mediaUrl: null,
    mediaType: null,
    createdAt: isoTime,
  };
}

// All mock messages live on the same simulated day. Newest-first so the
// FlatList (inverted) renders the newest at the bottom — matches buildChatListItems.
function buildThread(): ChatMessage[] {
  return [
    msg('m6', true, 'Show 👊 levo água extra :)', '2026-05-27T16:09:00.000Z'),
    msg('m5', false, 'Topo demais. Chego 17:55 lá.', '2026-05-27T16:08:00.000Z'),
    msg(
      'm4',
      true,
      'Você topa caminhada hoje 18h? A galera vai sair da entrada sul do parque.',
      '2026-05-27T16:02:00.000Z',
    ),
    msg(
      'm3',
      true,
      'Isso mesmo! Te vi ontem voltando do mercado.',
      '2026-05-27T15:52:00.000Z',
    ),
    msg(
      'm2',
      false,
      'Oi Ana! Tudo bem? Vc é da casa azul ali da praça né?',
      '2026-05-27T15:51:00.000Z',
    ),
    msg(
      'm1',
      true,
      'Oi! Vi você no grupo do Água verde 😊',
      '2026-05-27T15:48:00.000Z',
    ),
  ];
}

function buildRequestThread(): ChatMessage[] {
  return [
    msg(
      'r1',
      false,
      'Oi Ana! Sou seu vizinho da casa azul ali da praça. Vi seu post no grupo Água verde sobre a caminhada — posso entrar junto hoje?',
      '2026-05-27T16:08:00.000Z',
    ),
  ];
}

export function buildDmMockState(variant: DmMockVariant): DmMockState {
  const baseThread = buildThread();
  const baseStatuses: Record<string, OwnBubbleStatus> = {
    m5: 'read',
    m2: 'read',
  };
  // m5 ("Topo demais…") is a reply to m4 (the question about the walk).
  // m6 ("Show 👊 levo água extra :)") is a reply to m5.
  const baseReplyTo: Record<string, string> = {
    m5: 'm4',
    m6: 'm5',
  };

  switch (variant) {
    case 'online':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'online' },
        messages: baseThread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        awaitingApproval: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'lastSeen':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'lastSeen', label: 'hoje, 12:24' },
        messages: baseThread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        awaitingApproval: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'typing':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'typing' },
        messages: baseThread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: true,
        awaitingApproval: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'menu':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'online' },
        messages: baseThread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        awaitingApproval: false,
        actionSheetOpen: true,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'request':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'pendingApproval' },
        messages: buildRequestThread(),
        messageStatuses: { r1: 'pending' },
        messageReplyTo: {},
        showTypingBubble: false,
        awaitingApproval: true,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'replying':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'online' },
        messages: baseThread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        awaitingApproval: false,
        actionSheetOpen: false,
        composingReplyTo: 'm6', // composing a reply to the latest peer message
        composingDraft: 'Aí sim! Levo frutas e protetor.',
      };
    case 'failed':
      return {
        variant,
        peer: PEER,
        presence: { kind: 'online' },
        messages: baseThread,
        messageStatuses: {
          ...baseStatuses,
          m5: 'error', // turn the own reply into a failed send
        },
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        awaitingApproval: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
  }
}

export const VARIANT_LABELS: Record<DmMockVariant, string> = {
  online: 'D1 · Online',
  lastSeen: 'D2 · Visto por último',
  typing: 'D3 · Digitando…',
  menu: 'D4 · Menu',
  request: 'D5 · Solicitação',
  replying: 'D7 · Respondendo',
  failed: 'D8 · Falha',
};

export const VARIANT_ORDER: DmMockVariant[] = [
  'online',
  'lastSeen',
  'typing',
  'menu',
  'request',
  'replying',
  'failed',
];
