import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
  MessagePermission,
} from '@localloop/shared-types';
import {
  groupsApi,
  type GroupDetail,
  type JoinRequest,
} from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';
import { groupJoinRequestsKey } from '../useGroupJoinRequests/useGroupJoinRequests';
import { useResolveJoinRequest } from './useResolveJoinRequest';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { resolveJoinRequest: jest.fn() },
}));

const mockedResolve = groupsApi.resolveJoinRequest as jest.MockedFunction<
  typeof groupsApi.resolveJoinRequest
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

const baseDetail: GroupDetail = {
  id: 'g-1',
  name: 'G',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLat: -23.55,
  anchorLng: -46.63,
  anchorLabel: 'L',
  privacy: GroupPrivacy.APPROVAL_REQUIRED,
  memberCount: 10,
  sendTextPerm: MessagePermission.ALL_MEMBERS,
  sendMediaPerm: MessagePermission.ALL_MEMBERS,
  myRole: MemberRole.OWNER,
};

const baseRequest: JoinRequest = {
  id: 'r-1',
  userId: 'u-1',
  displayName: 'Alice',
  createdAt: '2026-01-01T00:00:00Z',
};

function seed(client: QueryClient) {
  client.setQueryData(groupDetailKey('g-1'), baseDetail);
  client.setQueryData(groupJoinRequestsKey('g-1'), [baseRequest]);
}

describe('useResolveJoinRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('approve removes the request + bumps memberCount on the cached detail', async () => {
    mockedResolve.mockResolvedValueOnce({ status: 'approved' });
    const { client, wrapper } = makeWrapper();
    seed(client);

    const { result } = renderHook(() => useResolveJoinRequest(), { wrapper });
    result.current.mutate({
      groupId: 'g-1',
      requestId: 'r-1',
      action: 'approve',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(groupJoinRequestsKey('g-1'))).toEqual([]);
    expect(client.getQueryData<GroupDetail>(groupDetailKey('g-1'))?.memberCount)
      .toBe(11);
    client.clear();
  });

  it('reject removes the request but leaves memberCount unchanged', async () => {
    mockedResolve.mockResolvedValueOnce({ status: 'rejected' });
    const { client, wrapper } = makeWrapper();
    seed(client);

    const { result } = renderHook(() => useResolveJoinRequest(), { wrapper });
    result.current.mutate({
      groupId: 'g-1',
      requestId: 'r-1',
      action: 'reject',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(groupJoinRequestsKey('g-1'))).toEqual([]);
    expect(client.getQueryData<GroupDetail>(groupDetailKey('g-1'))?.memberCount)
      .toBe(10);
    client.clear();
  });

  it('rolls back both caches when the API rejects', async () => {
    mockedResolve.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seed(client);

    const { result } = renderHook(() => useResolveJoinRequest(), { wrapper });
    result.current.mutate({
      groupId: 'g-1',
      requestId: 'r-1',
      action: 'approve',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(groupJoinRequestsKey('g-1'))).toEqual([
      baseRequest,
    ]);
    expect(client.getQueryData<GroupDetail>(groupDetailKey('g-1'))?.memberCount)
      .toBe(10);
    client.clear();
  });
});
