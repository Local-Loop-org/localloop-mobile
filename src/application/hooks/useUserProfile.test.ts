import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DmPermission, Provider } from '@localloop/shared-types';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';
import { USER_PROFILE_KEY, useUserProfile } from './useUserProfile';

jest.mock('@/infra/api/user.api', () => ({
  userApi: {
    getMe: jest.fn(),
  },
}));

const mockedGetMe = userApi.getMe as jest.MockedFunction<typeof userApi.getMe>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const sampleProfile: UserProfileResponse = {
  id: 'user-1',
  displayName: 'Andrey',
  avatarUrl: null,
  dmPermission: DmPermission.MEMBERS,
  provider: Provider.GOOGLE,
  createdAt: '2025-03-12T00:00:00.000Z',
};

describe('USER_PROFILE_KEY', () => {
  it('is a stable tuple', () => {
    expect(USER_PROFILE_KEY).toEqual(['user', 'me']);
  });
});

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and returns the profile from the API', async () => {
    mockedGetMe.mockResolvedValue(sampleProfile);

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetMe).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(sampleProfile);
  });

  it('surfaces API errors as query error state', async () => {
    mockedGetMe.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
  });
});
