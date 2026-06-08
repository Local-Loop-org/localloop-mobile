import {
  GroupPrivacy,
  MemberStatus,
  type NearbyGroup,
} from '@localloop/shared-types';

/**
 * Presence-eligibility rule shared by the discovery surfaces (Home, Map):
 * live "online" counts may only be shown for OPEN groups or groups the caller
 * is already an ACTIVE member of — never for closed groups the user hasn't
 * joined.
 */
export function canShowPresence(
  group: Pick<NearbyGroup, 'privacy' | 'memberStatus'>,
): boolean {
  return (
    group.privacy === GroupPrivacy.OPEN ||
    group.memberStatus === MemberStatus.ACTIVE
  );
}

/**
 * Merge a live presence count onto a group row, omitting the field entirely
 * when the count is zero so consumers can treat `liveCount` as "present ⇒ > 0".
 */
export function withLiveCount<T extends object>(
  group: T,
  liveCount: number,
): T & { liveCount?: number } {
  return liveCount > 0 ? { ...group, liveCount } : group;
}
