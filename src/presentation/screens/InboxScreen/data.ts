// TODO(phase-4): replace MOCK_DMS / MOCK_REQUESTS with React Query hooks
// (e.g. `useDirectMessages()` and `useDmRequests()`) once the DM API ships.
// The shapes here intentionally match a plausible future API so the swap is
// a one-line return-type change in the container.

import type { DmConversation, DmRequest } from './types';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_DMS: DmConversation[] = [
  {
    id: 'dm-ana',
    peer: { id: 'u-ana', displayName: 'Ana Beatriz', avatarUrl: null },
    lastMessage: {
      content: 'Levo água extra :)',
      createdAt: minutesAgo(2),
      fromMe: false,
    },
    unreadCount: 3,
    isArchived: false,
  },
  {
    id: 'dm-rafa',
    peer: { id: 'u-rafa', displayName: 'Rafael Souza', avatarUrl: null },
    lastMessage: {
      content: 'vejo daqui a pouco',
      createdAt: minutesAgo(8),
      fromMe: true,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-julia',
    peer: { id: 'u-julia', displayName: 'Julia M.', avatarUrl: null },
    lastMessage: {
      content: 'Você viu o evento de sábado?',
      createdAt: minutesAgo(15),
      fromMe: false,
    },
    unreadCount: 1,
    isArchived: false,
  },
  {
    id: 'dm-carlos',
    peer: { id: 'u-carlos', displayName: 'Carlos P.', avatarUrl: null },
    lastMessage: {
      content: 'Beleza, te aviso amanhã',
      createdAt: hoursAgo(1),
      fromMe: false,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-mari',
    peer: { id: 'u-mari', displayName: 'Mariana C.', avatarUrl: null },
    lastMessage: {
      content: 'bora correr 7h?',
      createdAt: hoursAgo(2),
      fromMe: true,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-pedro',
    peer: { id: 'u-pedro', displayName: 'Pedro Lima', avatarUrl: null },
    lastMessage: {
      content: 'Recebi sua entrega, valeu!',
      createdAt: hoursAgo(3),
      fromMe: false,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-gabi',
    peer: { id: 'u-gabi', displayName: 'Gabi Tavares', avatarUrl: null },
    lastMessage: {
      content: 'kkk show, depois te chamo',
      createdAt: daysAgo(1),
      fromMe: false,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-lucas',
    peer: { id: 'u-lucas', displayName: 'Lucas O.', avatarUrl: null },
    lastMessage: {
      content: 'confirmado',
      createdAt: daysAgo(1),
      fromMe: true,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-beto',
    peer: { id: 'u-beto', displayName: 'Beto Maia', avatarUrl: null },
    lastMessage: {
      content: 'tudo bem por aqui',
      createdAt: daysAgo(3),
      fromMe: false,
    },
    unreadCount: 0,
    isArchived: false,
  },
  {
    id: 'dm-sofia',
    peer: { id: 'u-sofia', displayName: 'Sofia R.', avatarUrl: null },
    lastMessage: {
      content: 'foto',
      createdAt: daysAgo(4),
      fromMe: false,
    },
    unreadCount: 0,
    isArchived: false,
  },
];

export const MOCK_REQUESTS: DmRequest[] = [
  {
    id: 'req-helena',
    peer: { id: 'u-helena', displayName: 'Helena S.', avatarUrl: null },
    message: 'Oi! Vi você no grupo do Ibirá, posso te chamar?',
    createdAt: minutesAgo(5),
  },
  {
    id: 'req-thiago',
    peer: { id: 'u-thiago', displayName: 'Thiago A.', avatarUrl: null },
    message: 'Tu vai amanhã na corrida?',
    createdAt: hoursAgo(1),
  },
  {
    id: 'req-bia',
    peer: { id: 'u-bia', displayName: 'Bia N.', avatarUrl: null },
    message: 'oi vizinha',
    createdAt: hoursAgo(3),
  },
];
