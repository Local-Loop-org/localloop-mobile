import { AnchorType, type ChatMessage } from '@localloop/shared-types';
import type { OwnBubbleStatus } from '@/shared/ui/chat/OwnBubble';

export type GroupMockVariant =
  | 'standard'
  | 'typing'
  | 'menu'
  | 'failed'
  | 'replying';

export interface GroupMockGroup {
  id: string;
  name: string;
  anchorType: AnchorType;
  memberCount: number;
  onlineCount: number;
}

export interface GroupMockSender {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export type GroupMockPresence =
  | { kind: 'idle' }
  | { kind: 'typing'; senderName: string };

export interface GroupMockState {
  variant: GroupMockVariant;
  group: GroupMockGroup;
  presence: GroupMockPresence;
  messages: ChatMessage[];
  messageStatuses: Record<string, OwnBubbleStatus>;
  messageReplyTo: Record<string, string>;
  showTypingBubble: boolean;
  actionSheetOpen: boolean;
  composingReplyTo: string | null;
  composingDraft: string;
}

export const ME: GroupMockSender = {
  id: 'you-1',
  name: 'Você',
  avatarUrl: null,
};

export const ANA: GroupMockSender = {
  id: 'peer-ana',
  name: 'Ana Beatriz',
  avatarUrl: null,
};

export const BRUNO: GroupMockSender = {
  id: 'peer-bruno',
  name: 'Bruno Lima',
  avatarUrl: null,
};

export const CARLA: GroupMockSender = {
  id: 'peer-carla',
  name: 'Carla Souza',
  avatarUrl: null,
};

export const GROUP: GroupMockGroup = {
  id: 'group-1',
  name: 'Água verde',
  anchorType: AnchorType.NEIGHBORHOOD,
  memberCount: 42,
  onlineCount: 6,
};

function msg(
  id: string,
  sender: GroupMockSender,
  content: string,
  isoTime: string,
): ChatMessage {
  return {
    id,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatarUrl: sender.avatarUrl,
    content,
    mediaUrl: null,
    mediaType: null,
    createdAt: isoTime,
  };
}

// Newest-first ordering — matches the inverted FlatList in ChatThread.
function buildThread(): ChatMessage[] {
  return [
    msg(
      'g7',
      ME,
      'Topo! Quem mais vai?',
      '2026-05-27T16:14:00.000Z',
    ),
    msg(
      'g6',
      ANA,
      'Show 👊 levo água extra :)',
      '2026-05-27T16:09:00.000Z',
    ),
    msg(
      'g5',
      BRUNO,
      'Combinado, chego 17:55 lá!',
      '2026-05-27T16:08:00.000Z',
    ),
    msg(
      'g4',
      ANA,
      'Você topa caminhada hoje 18h? Saída entrada sul do parque.',
      '2026-05-27T16:02:00.000Z',
    ),
    msg(
      'g3',
      CARLA,
      'Acabei de chegar no mercado, alguém precisa de algo?',
      '2026-05-27T15:52:00.000Z',
    ),
    msg(
      'g2',
      ME,
      'Oi pessoal! Cheguei aqui no bairro semana passada.',
      '2026-05-27T15:50:00.000Z',
    ),
    msg(
      'g1',
      ANA,
      'Bem vinda ao grupo do Água verde 😊',
      '2026-05-27T15:48:00.000Z',
    ),
  ];
}

export function buildGroupMockState(variant: GroupMockVariant): GroupMockState {
  const thread = buildThread();
  // g5 is Bruno's reply to Ana's question (g4).
  // g6 is Ana's reply to Bruno (g5).
  // g7 is the user replying to Ana (g6).
  const baseReplyTo: Record<string, string> = {
    g5: 'g4',
    g6: 'g5',
    g7: 'g6',
  };
  const baseStatuses: Record<string, OwnBubbleStatus> = {
    g7: 'sent',
    g2: 'sent',
  };

  switch (variant) {
    case 'standard':
      return {
        variant,
        group: GROUP,
        presence: { kind: 'idle' },
        messages: thread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'typing':
      return {
        variant,
        group: GROUP,
        presence: { kind: 'typing', senderName: ANA.name.split(' ')[0] },
        messages: thread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: true,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'menu':
      return {
        variant,
        group: GROUP,
        presence: { kind: 'idle' },
        messages: thread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        actionSheetOpen: true,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'failed':
      return {
        variant,
        group: GROUP,
        presence: { kind: 'idle' },
        messages: thread,
        messageStatuses: {
          ...baseStatuses,
          g7: 'error',
        },
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        actionSheetOpen: false,
        composingReplyTo: null,
        composingDraft: '',
      };
    case 'replying':
      return {
        variant,
        group: GROUP,
        presence: { kind: 'idle' },
        messages: thread,
        messageStatuses: baseStatuses,
        messageReplyTo: baseReplyTo,
        showTypingBubble: false,
        actionSheetOpen: false,
        composingReplyTo: 'g6',
        composingDraft: 'Aí sim! Levo frutas e protetor.',
      };
  }
}

export const VARIANT_LABELS: Record<GroupMockVariant, string> = {
  standard: 'G1 · Padrão',
  typing: 'G2 · Digitando',
  menu: 'G3 · Menu',
  failed: 'G4 · Falha',
  replying: 'G5 · Respondendo',
};

export const VARIANT_ORDER: GroupMockVariant[] = [
  'standard',
  'typing',
  'menu',
  'failed',
  'replying',
];
