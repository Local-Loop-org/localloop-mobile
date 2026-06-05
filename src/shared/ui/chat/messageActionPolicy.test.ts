import { MemberRole, type ChatMessage } from '@localloop/shared-types';
import type { ChatSendStatus } from '@/shared/chat/sendStatus';
import {
  availableMessageActions,
  hasAnyAction,
  type ChatConversationKind,
} from './messageActionPolicy';

const ME = 'me';
const OTHER = 'other';

function msg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm-1',
    clientMessageId: null,
    senderId: OTHER,
    senderName: 'Alice',
    senderAvatarUrl: null,
    content: 'hello',
    mediaUrl: null,
    mediaType: null,
    createdAt: '2026-05-28T10:00:00.000Z',
    replyTo: null,
    isDeleted: false,
    editedAt: null,
    ...overrides,
  };
}

interface Case {
  name: string;
  message: Partial<ChatMessage>;
  conversation: ChatConversationKind;
  currentUserId: string | null;
  myRole?: MemberRole | null;
  sendStatus?: ChatSendStatus | null;
  expected: {
    canReply: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDiscard: boolean;
  };
}

const cases: Case[] = [
  // ── DM ──
  {
    name: 'DM own non-deleted → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: true, canEdit: true, canDelete: true, canDiscard: false },
  },
  {
    name: 'DM peer non-deleted → reply only',
    message: { senderId: OTHER },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: true, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'DM own deleted → no actions',
    message: { senderId: ME, isDeleted: true },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'DM peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'DM own temp sending → no actions',
    message: { id: 'temp-abc', senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    sendStatus: 'sending',
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'DM own temp no sendStatus → no actions',
    message: { id: 'temp-abc', senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'DM own temp error → discard only',
    message: { id: 'temp-abc', senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    sendStatus: 'error',
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: true },
  },

  // ── Group, regular MEMBER ──
  {
    name: 'Group MEMBER own → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: true, canEdit: true, canDelete: true, canDiscard: false },
  },
  {
    name: 'Group MEMBER peer → reply only',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: true, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'Group MEMBER peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'Group MEMBER own temp sending → no actions',
    message: { id: 'temp-xyz', senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    sendStatus: 'sending',
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },
  {
    name: 'Group MEMBER own temp error → discard only',
    message: { id: 'temp-xyz', senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    sendStatus: 'error',
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: true },
  },

  // ── Group, MODERATOR ──
  {
    name: 'Group MODERATOR peer → reply + delete (edit is author-only)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: true, canEdit: false, canDelete: true, canDiscard: false },
  },
  {
    name: 'Group MODERATOR own → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: true, canEdit: true, canDelete: true, canDiscard: false },
  },
  {
    name: 'Group MODERATOR peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: false, canEdit: false, canDelete: false, canDiscard: false },
  },

  // ── Group, OWNER ──
  {
    name: 'Group OWNER peer → reply + delete (edit is author-only)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.OWNER,
    expected: { canReply: true, canEdit: false, canDelete: true, canDiscard: false },
  },

  // ── Edge: no role known (route param null) on a peer message ──
  {
    name: 'Group null role peer → reply only (no privileged actions)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: null,
    expected: { canReply: true, canEdit: false, canDelete: false, canDiscard: false },
  },

  // ── Edge: signed-out user (currentUserId null) on a peer message ──
  {
    name: 'Logged-out currentUserId → reply only (no ownership)',
    message: { senderId: OTHER },
    conversation: 'dm',
    currentUserId: null,
    expected: { canReply: true, canEdit: false, canDelete: false, canDiscard: false },
  },
];

describe('availableMessageActions', () => {
  it.each(cases)('$name', ({ message, conversation, currentUserId, myRole, sendStatus, expected }) => {
    const result = availableMessageActions({
      message: msg(message),
      conversation,
      currentUserId,
      myRole,
      sendStatus,
    });
    expect(result).toEqual(expected);
  });
});

describe('hasAnyAction', () => {
  it('returns true when any flag is true', () => {
    expect(hasAnyAction({ canReply: true, canEdit: false, canDelete: false, canDiscard: false })).toBe(true);
    expect(hasAnyAction({ canReply: false, canEdit: true, canDelete: false, canDiscard: false })).toBe(true);
    expect(hasAnyAction({ canReply: false, canEdit: false, canDelete: true, canDiscard: false })).toBe(true);
    expect(hasAnyAction({ canReply: false, canEdit: false, canDelete: false, canDiscard: true })).toBe(true);
  });

  it('returns false when all flags are false', () => {
    expect(hasAnyAction({ canReply: false, canEdit: false, canDelete: false, canDiscard: false })).toBe(false);
  });
});
