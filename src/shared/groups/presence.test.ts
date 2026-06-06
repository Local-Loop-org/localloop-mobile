import {
  GroupPrivacy,
  MemberStatus,
  type NearbyGroup,
} from '@localloop/shared-types';
import { canShowPresence, withLiveCount } from './presence';

type PresenceInput = Pick<NearbyGroup, 'privacy' | 'memberStatus'>;

describe('canShowPresence', () => {
  it('allows presence for OPEN groups regardless of membership', () => {
    const group: PresenceInput = {
      privacy: GroupPrivacy.OPEN,
      memberStatus: null,
    };
    expect(canShowPresence(group)).toBe(true);
  });

  it('allows presence for closed groups the caller is an ACTIVE member of', () => {
    const group: PresenceInput = {
      privacy: GroupPrivacy.APPROVAL_REQUIRED,
      memberStatus: MemberStatus.ACTIVE,
    };
    expect(canShowPresence(group)).toBe(true);
  });

  it('hides presence for closed groups the caller has not joined', () => {
    const group: PresenceInput = {
      privacy: GroupPrivacy.APPROVAL_REQUIRED,
      memberStatus: null,
    };
    expect(canShowPresence(group)).toBe(false);
  });

  it('hides presence for closed groups with a PENDING request', () => {
    const group: PresenceInput = {
      privacy: GroupPrivacy.APPROVAL_REQUIRED,
      memberStatus: MemberStatus.PENDING,
    };
    expect(canShowPresence(group)).toBe(false);
  });
});

describe('withLiveCount', () => {
  it('attaches the count when it is greater than zero', () => {
    expect(withLiveCount({ id: 'g-1' }, 4)).toEqual({ id: 'g-1', liveCount: 4 });
  });

  it('omits the field (returns the original) when the count is zero', () => {
    const group = { id: 'g-1' };
    const result = withLiveCount(group, 0);
    expect(result).toBe(group);
    expect('liveCount' in result).toBe(false);
  });
});
