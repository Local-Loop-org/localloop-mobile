import { MemberRole, type ChatMessage } from '@localloop/shared-types';
import type { ChatSendStatus } from '@/shared/chat/sendStatus';

export type ChatConversationKind = 'group' | 'dm';

export interface AvailableMessageActions {
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDiscard: boolean;
}

export interface MessageActionContext {
  message: ChatMessage;
  currentUserId: string | null;
  conversation: ChatConversationKind;
  /** Required for group conversations; ignored for DM. */
  myRole?: MemberRole | null;
  /** Local-only optimistic send state. Only consulted for temp messages. */
  sendStatus?: ChatSendStatus | null;
}

const NONE: AvailableMessageActions = {
  canReply: false,
  canEdit: false,
  canDelete: false,
  canDiscard: false,
};

const DISCARD_ONLY: AvailableMessageActions = {
  canReply: false,
  canEdit: false,
  canDelete: false,
  canDiscard: true,
};

export function availableMessageActions(
  ctx: MessageActionContext,
): AvailableMessageActions {
  const { message, currentUserId, conversation, myRole, sendStatus } = ctx;

  if (message.isDeleted) return NONE;

  // Optimistic temp messages have no server id, so reply/edit/delete via the
  // sheet can't address them. The one exception is a temp that has failed to
  // send: long-press offers Discard so the user can drop it from the cache.
  if (message.id.startsWith('temp-')) {
    return sendStatus === 'error' ? DISCARD_ONLY : NONE;
  }

  const isOwn = !!currentUserId && message.senderId === currentUserId;
  const isPrivileged =
    conversation === 'group' &&
    (myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR);

  return {
    canReply: true,
    canEdit: isOwn,
    canDelete: isOwn || isPrivileged,
    canDiscard: false,
  };
}

export function hasAnyAction(actions: AvailableMessageActions): boolean {
  return (
    actions.canReply ||
    actions.canEdit ||
    actions.canDelete ||
    actions.canDiscard
  );
}
