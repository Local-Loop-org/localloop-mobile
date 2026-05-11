import { MemberRole } from '@localloop/shared-types';

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  [MemberRole.OWNER]: 'Líder',
  [MemberRole.MODERATOR]: 'Moderador',
  [MemberRole.MEMBER]: 'Membro',
};
