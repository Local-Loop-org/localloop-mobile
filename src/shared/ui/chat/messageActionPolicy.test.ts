import { MemberRole, type ChatMessage } from '@localloop/shared-types';
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
  expected: { canReply: boolean; canEdit: boolean; canDelete: boolean };
}

const cases: Case[] = [
  // ── DM ──
  {
    name: 'DM own non-deleted → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: true, canEdit: true, canDelete: true },
  },
  {
    name: 'DM peer non-deleted → reply only',
    message: { senderId: OTHER },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: true, canEdit: false, canDelete: false },
  },
  {
    name: 'DM own deleted → no actions',
    message: { senderId: ME, isDeleted: true },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },
  {
    name: 'DM peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },
  {
    name: 'DM own temp (optimistic) → no actions',
    message: { id: 'temp-abc', senderId: ME },
    conversation: 'dm',
    currentUserId: ME,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },

  // ── Group, regular MEMBER ──
  {
    name: 'Group MEMBER own → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: true, canEdit: true, canDelete: true },
  },
  {
    name: 'Group MEMBER peer → reply only',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: true, canEdit: false, canDelete: false },
  },
  {
    name: 'Group MEMBER peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },
  {
    name: 'Group MEMBER own temp → no actions',
    message: { id: 'temp-xyz', senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MEMBER,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },

  // ── Group, MODERATOR ──
  {
    name: 'Group MODERATOR peer → reply + delete (edit is author-only)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: true, canEdit: false, canDelete: true },
  },
  {
    name: 'Group MODERATOR own → reply + edit + delete',
    message: { senderId: ME },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: true, canEdit: true, canDelete: true },
  },
  {
    name: 'Group MODERATOR peer deleted → no actions',
    message: { senderId: OTHER, isDeleted: true },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.MODERATOR,
    expected: { canReply: false, canEdit: false, canDelete: false },
  },

  // ── Group, OWNER ──
  {
    name: 'Group OWNER peer → reply + delete (edit is author-only)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: MemberRole.OWNER,
    expected: { canReply: true, canEdit: false, canDelete: true },
  },

  // ── Edge: no role known (route param null) on a peer message ──
  {
    name: 'Group null role peer → reply only (no privileged actions)',
    message: { senderId: OTHER },
    conversation: 'group',
    currentUserId: ME,
    myRole: null,
    expected: { canReply: true, canEdit: false, canDelete: false },
  },

  // ── Edge: signed-out user (currentUserId null) on a peer message ──
  {
    name: 'Logged-out currentUserId → reply only (no ownership)',
    message: { senderId: OTHER },
    conversation: 'dm',
    currentUserId: null,
    expected: { canReply: true, canEdit: false, canDelete: false },
  },
];

describe('availableMessageActions', () => {
  it.each(cases)('$name', ({ message, conversation, currentUserId, myRole, expected }) => {
    const result = availableMessageActions({
      message: msg(message),
      conversation,
      currentUserId,
      myRole,
    });
    expect(result).toEqual(expected);
  });
});

describe('hasAnyAction', () => {
  it('returns true when any flag is true', () => {
    expect(hasAnyAction({ canReply: true, canEdit: false, canDelete: false })).toBe(true);
    expect(hasAnyAction({ canReply: false, canEdit: true, canDelete: false })).toBe(true);
    expect(hasAnyAction({ canReply: false, canEdit: false, canDelete: true })).toBe(true);
  });

  it('returns false when all flags are false', () => {
    expect(hasAnyAction({ canReply: false, canEdit: false, canDelete: false })).toBe(false);
  });
});
