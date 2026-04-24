import MockAdapter from 'axios-mock-adapter';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import { apiClient } from './api-client';
import { groupsApi } from './groups.api';

describe('groupsApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  it('createGroup POSTs /groups with the full body and returns the created group', async () => {
    const body = {
      name: 'Morumbi Runners',
      description: 'Weekly runs',
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      lat: -23.55,
      lng: -46.63,
      privacy: GroupPrivacy.OPEN,
    };
    const response = {
      id: 'g-1',
      name: body.name,
      anchorType: body.anchorType,
      anchorLabel: body.anchorLabel,
      privacy: body.privacy,
      memberCount: 1,
      myRole: MemberRole.OWNER,
    };
    mock.onPost('/groups').reply((config) => {
      expect(JSON.parse(config.data)).toEqual(body);
      return [200, response];
    });

    const result = await groupsApi.createGroup(body);

    expect(result).toEqual(response);
  });

  it('getNearbyGroups GETs /groups/nearby with lat/lng params and unwraps data', async () => {
    const groups = [
      {
        id: 'g-1',
        name: 'Morumbi',
        description: null,
        anchorType: AnchorType.NEIGHBORHOOD,
        anchorLabel: 'Morumbi',
        proximityLabel: 'Mesmo bairro',
        privacy: GroupPrivacy.OPEN,
        memberCount: 5,
      },
    ];
    mock.onGet('/groups/nearby').reply((config) => {
      expect(config.params).toEqual({ lat: -23.55, lng: -46.63 });
      return [200, { data: groups }];
    });

    const result = await groupsApi.getNearbyGroups({
      lat: -23.55,
      lng: -46.63,
    });

    expect(result).toEqual(groups);
  });

  it('getGroupDetail GETs /groups/:id and returns the body', async () => {
    const detail = {
      id: 'g-1',
      name: 'Morumbi',
      description: null,
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      privacy: GroupPrivacy.OPEN,
      memberCount: 5,
      myRole: MemberRole.MEMBER,
    };
    mock.onGet('/groups/g-1').reply(200, detail);

    const result = await groupsApi.getGroupDetail('g-1');

    expect(result).toEqual(detail);
  });

  it('joinGroup POSTs /groups/:id/join and returns the result', async () => {
    const response = { status: 'joined', role: MemberRole.MEMBER };
    mock.onPost('/groups/g-1/join').reply(200, response);

    const result = await groupsApi.joinGroup('g-1');

    expect(result).toEqual(response);
  });

  it('leaveGroup DELETEs /groups/:groupId/members/me and returns void on 204', async () => {
    let called = false;
    mock.onDelete('/groups/g-1/members/me').reply(() => {
      called = true;
      return [204];
    });

    const result = await groupsApi.leaveGroup('g-1');

    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it('listJoinRequests GETs /groups/:groupId/requests and unwraps data', async () => {
    const requests = [
      {
        id: 'req-1',
        userId: 'u-1',
        displayName: 'Alice',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ];
    mock.onGet('/groups/g-1/requests').reply(200, { data: requests });

    const result = await groupsApi.listJoinRequests('g-1');

    expect(result).toEqual(requests);
  });

  it('resolveJoinRequest PATCHes /groups/:groupId/requests/:requestId with the action', async () => {
    const response = { status: 'approved' };
    mock.onPatch('/groups/g-1/requests/req-1').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ action: 'approve' });
      return [200, response];
    });

    const result = await groupsApi.resolveJoinRequest('g-1', 'req-1', 'approve');

    expect(result).toEqual(response);
  });

  it('listMembers GETs /groups/:groupId/members with limit=50 and optional before cursor', async () => {
    const members = {
      data: [
        {
          userId: 'u-1',
          displayName: 'Alice',
          avatarUrl: null,
          role: MemberRole.OWNER,
        },
      ],
      next_cursor: 'cursor-xyz',
    };
    mock.onGet('/groups/g-1/members').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 50 });
      return [200, members];
    });

    const firstPage = await groupsApi.listMembers('g-1');
    expect(firstPage).toEqual(members);

    mock.onGet('/groups/g-1/members').replyOnce((config) => {
      expect(config.params).toEqual({ limit: 50, before: 'cursor-xyz' });
      return [200, { data: [], next_cursor: null }];
    });

    const secondPage = await groupsApi.listMembers('g-1', 'cursor-xyz');
    expect(secondPage).toEqual({ data: [], next_cursor: null });
  });

  it('banMember DELETEs /groups/:groupId/members/:userId and returns void on 204', async () => {
    let called = false;
    mock.onDelete('/groups/g-1/members/u-42').reply(() => {
      called = true;
      return [204];
    });

    const result = await groupsApi.banMember('g-1', 'u-42');

    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });
});
