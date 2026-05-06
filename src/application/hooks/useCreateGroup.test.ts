import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, GroupPrivacy, MemberRole } from '@localloop/shared-types';
import { groupsApi, type CreatedGroup } from '@/infra/api/groups.api';
import { useCreateGroup } from './useCreateGroup';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { createGroup: jest.fn() },
}));

const mockedCreateGroup = groupsApi.createGroup as jest.MockedFunction<
  typeof groupsApi.createGroup
>;

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const sampleResponse: CreatedGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  privacy: GroupPrivacy.OPEN,
  memberCount: 1,
  myRole: MemberRole.OWNER,
};

describe('useCreateGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls groupsApi.createGroup with the body and resolves with CreatedGroup', async () => {
    mockedCreateGroup.mockResolvedValue(sampleResponse);
    const client = makeClient();

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: makeWrapper(client),
    });

    const created = await result.current.mutateAsync({
      name: 'Morumbi Runners',
      description: 'Bora correr',
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      lat: -23.55,
      lng: -46.6,
      privacy: GroupPrivacy.OPEN,
    });

    expect(mockedCreateGroup).toHaveBeenCalledWith({
      name: 'Morumbi Runners',
      description: 'Bora correr',
      anchorType: AnchorType.NEIGHBORHOOD,
      anchorLabel: 'Morumbi',
      lat: -23.55,
      lng: -46.6,
      privacy: GroupPrivacy.OPEN,
    });
    expect(created).toEqual(sampleResponse);
  });

  it('invalidates MY_GROUPS_KEY and the nearby-groups prefix on success', async () => {
    mockedCreateGroup.mockResolvedValue(sampleResponse);
    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({
      name: 'X',
      anchorType: AnchorType.ESTABLISHMENT,
      anchorLabel: 'Bar',
      lat: 0,
      lng: 0,
      privacy: GroupPrivacy.OPEN,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups', 'me'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups', 'nearby'] });
  });

  it('surfaces API errors via the mutation error state', async () => {
    mockedCreateGroup.mockRejectedValueOnce(new Error('boom'));
    const client = makeClient();

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: makeWrapper(client),
    });

    await expect(
      result.current.mutateAsync({
        name: 'X',
        anchorType: AnchorType.ESTABLISHMENT,
        anchorLabel: 'Bar',
        lat: 0,
        lng: 0,
        privacy: GroupPrivacy.OPEN,
      }),
    ).rejects.toThrow('boom');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
  });
});
