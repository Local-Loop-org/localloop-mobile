import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import { groupsApi } from '@/infra/api/groups.api';
import { nearbyGroupsKey, useNearbyGroups } from './useNearbyGroups';

jest.mock('@/infra/api/groups.api', () => ({
  groupsApi: { getNearbyGroups: jest.fn() },
}));

const mockedGetNearby = groupsApi.getNearbyGroups as jest.Mock;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const sampleGroup = {
  id: 'g-1',
  name: 'Morumbi Runners',
  description: null,
  anchorType: AnchorType.NEIGHBORHOOD,
  anchorLabel: 'Morumbi',
  distanceMeters: 210,
  anchorLat: -23.55,
  anchorLng: -46.63,
  privacy: GroupPrivacy.OPEN,
  memberCount: 5,
};

describe('nearbyGroupsKey', () => {
  it('produces a stable key tuple coarsened to ~110m', () => {
    expect(nearbyGroupsKey({ lat: -23.5501, lng: -46.6333 })).toEqual([
      'groups',
      'nearby',
      '-23.550,-46.633',
      null,
    ]);
  });

  it('includes radiusKm when provided', () => {
    expect(nearbyGroupsKey({ lat: -23.5501, lng: -46.6333 }, 10)).toEqual([
      'groups',
      'nearby',
      '-23.550,-46.633',
      10,
    ]);
  });

  it('returns a sentinel key when coords are null', () => {
    expect(nearbyGroupsKey(null)).toEqual(['groups', 'nearby', null]);
  });

  it('changes when the device moves more than the coarsened precision', () => {
    const a = nearbyGroupsKey({ lat: -23.5501, lng: -46.6333 });
    const b = nearbyGroupsKey({ lat: -23.5601, lng: -46.6333 });
    expect(a).not.toEqual(b);
  });
});

describe('useNearbyGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNearby.mockResolvedValue([sampleGroup]);
  });

  it('does not fire when coords are null', () => {
    const { result } = renderHook(() => useNearbyGroups(null), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGetNearby).not.toHaveBeenCalled();
  });

  it('fetches nearby groups when coords are provided', async () => {
    const coords = { lat: -23.55, lng: -46.63 };
    const { result } = renderHook(() => useNearbyGroups(coords), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetNearby).toHaveBeenCalledWith({ ...coords, radiusKm: undefined });
    expect(result.current.data).toEqual([sampleGroup]);
  });

  it('surfaces a query error when the nearby fetch fails', async () => {
    mockedGetNearby.mockRejectedValueOnce(new Error('boom'));
    const coords = { lat: -23.55, lng: -46.63 };

    const { result } = renderHook(() => useNearbyGroups(coords), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
  });
});
