import { MemberRole, MessagePermission } from '@localloop/shared-types';
import { canSendUnderPolicy, SEND_BLOCKED_HINT } from './sendPermissions';

describe('canSendUnderPolicy', () => {
  it('allows everyone (including non-members) under ALL_MEMBERS', () => {
    expect(
      canSendUnderPolicy(MemberRole.MEMBER, MessagePermission.ALL_MEMBERS),
    ).toBe(true);
    expect(canSendUnderPolicy(null, MessagePermission.ALL_MEMBERS)).toBe(true);
  });

  it('never blocks while the policy is unknown (detail not loaded)', () => {
    expect(canSendUnderPolicy(MemberRole.MEMBER, undefined)).toBe(true);
  });

  it('restricts ADMIN_ONLY to OWNER / MODERATOR', () => {
    expect(
      canSendUnderPolicy(MemberRole.OWNER, MessagePermission.ADMIN_ONLY),
    ).toBe(true);
    expect(
      canSendUnderPolicy(MemberRole.MODERATOR, MessagePermission.ADMIN_ONLY),
    ).toBe(true);
    expect(
      canSendUnderPolicy(MemberRole.MEMBER, MessagePermission.ADMIN_ONLY),
    ).toBe(false);
    expect(canSendUnderPolicy(null, MessagePermission.ADMIN_ONLY)).toBe(false);
  });

  it('is optimistic for MEMBERS_IN_RADIUS (the API is the enforcement gate)', () => {
    expect(
      canSendUnderPolicy(MemberRole.MEMBER, MessagePermission.MEMBERS_IN_RADIUS),
    ).toBe(true);
  });
});

describe('SEND_BLOCKED_HINT', () => {
  it('only provides a proactive hint for ADMIN_ONLY', () => {
    expect(SEND_BLOCKED_HINT[MessagePermission.ADMIN_ONLY]).toBe(
      'Apenas admins podem enviar mensagens',
    );
    expect(SEND_BLOCKED_HINT[MessagePermission.ALL_MEMBERS]).toBeUndefined();
    expect(SEND_BLOCKED_HINT[MessagePermission.MEMBERS_IN_RADIUS]).toBeUndefined();
  });
});
