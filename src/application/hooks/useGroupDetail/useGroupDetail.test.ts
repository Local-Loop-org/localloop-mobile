import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
  MessagePermission,
} from '@localloop/shared-types';
import { groupsApi } from '@/infra/api/groups.api';
import { useGroupDetail, groupDetailKey } from './useGroupDetail';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getGroupDetail: jest.fn() },
}));

const mockedGetDetail = groupsApi.getGroupDetail as jest.MockedFunction<
  typeof groupsApi.getGroupDetail
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

const baseDetail = {
  id: 'g-1',
  name: 'Morumbi Runners',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLat: -23.55,
  anchorLng: -46.63,
  anchorLabel: 'Morumbi',
  privacy: GroupPrivacy.OPEN,
  memberCount: 10,
  sendTextPerm: MessagePermission.ALL_MEMBERS,
  sendMediaPerm: MessagePermission.ALL_MEMBERS,
  myRole: MemberRole.MEMBER,
};

describe('useGroupDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches detail via groupsApi.getGroupDetail', async () => {
    mockedGetDetail.mockResolvedValueOnce(baseDetail);
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useGroupDetail('g-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGetDetail).toHaveBeenCalledWith('g-1');
    expect(result.current.data).toEqual(baseDetail);
    client.clear();
  });

  it('exposes an error state when getGroupDetail rejects', async () => {
    mockedGetDetail.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useGroupDetail('g-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
    client.clear();
  });

  it('groupDetailKey is stable per groupId', () => {
    expect(groupDetailKey('g-1')).toEqual(['groups', 'detail', 'g-1']);
  });
});
