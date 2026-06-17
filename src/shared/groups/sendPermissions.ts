import { MemberRole, MessagePermission } from '@localloop/shared-types';

/**
 * Whether the caller may send a message under a group's send policy.
 *
 * - `ALL_MEMBERS` (and an undefined policy, i.e. group detail not loaded yet) →
 *   never blocks.
 * - `ADMIN_ONLY` → only OWNER / MODERATOR.
 * - `MEMBERS_IN_RADIUS` → optimistic `true`: the client can't evaluate radius
 *   (the group's anchor geohash isn't exposed and the user's stored geohash is
 *   stale), so the API is the enforcement gate — a rejected send surfaces as a
 *   `SEND_PERMISSION_DENIED` error.
 */
export function canSendUnderPolicy(
  myRole: MemberRole | null,
  perm: MessagePermission | undefined,
): boolean {
  switch (perm) {
    case MessagePermission.ADMIN_ONLY:
      return myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR;
    case MessagePermission.MEMBERS_IN_RADIUS:
    case MessagePermission.ALL_MEMBERS:
    case undefined:
      return true;
    default:
      return true;
  }
}

/**
 * Contextual hint shown when sending is blocked. Only `ADMIN_ONLY` is evaluable
 * client-side, so it's the only policy with a proactive hint today.
 */
export const SEND_BLOCKED_HINT: Partial<Record<MessagePermission, string>> = {
  [MessagePermission.ADMIN_ONLY]: 'Apenas admins podem enviar mensagens',
};
