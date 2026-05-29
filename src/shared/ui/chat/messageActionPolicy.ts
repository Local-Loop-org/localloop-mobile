import { MemberRole, type ChatMessage } from '@localloop/shared-types';

export type ChatConversationKind = 'group' | 'dm';

export interface AvailableMessageActions {
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface MessageActionContext {
  message: ChatMessage;
  currentUserId: string | null;
  conversation: ChatConversationKind;
  /** Required for group conversations; ignored for DM. */
  myRole?: MemberRole | null;
}

const NONE: AvailableMessageActions = {
  canReply: false,
  canEdit: false,
  canDelete: false,
};

export function availableMessageActions(
  ctx: MessageActionContext,
): AvailableMessageActions {
  const { message, currentUserId, conversation, myRole } = ctx;

  // Universal short-circuits: deleted messages or optimistic temp messages
  // have no actionable surface. Temp messages don't have a real server id yet,
  // so reply/edit/delete via the sheet can't address them; Cluster E retry/cancel
  // is the affordance for those.
  if (message.isDeleted) return NONE;
  if (message.id.startsWith('temp-')) return NONE;

  const isOwn = !!currentUserId && message.senderId === currentUserId;
  const isPrivileged =
    conversation === 'group' &&
    (myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR);

  return {
    canReply: true,
    canEdit: isOwn || isPrivileged,
    canDelete: isOwn || isPrivileged,
  };
}

export function hasAnyAction(actions: AvailableMessageActions): boolean {
  return actions.canReply || actions.canEdit || actions.canDelete;
}
