import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DmPermission, Provider } from '@localloop/shared-types';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';
import { useAuthStore } from '@/application/stores/auth.store';
import { useUpdateUserProfile } from './useUpdateUserProfile';
import { USER_PROFILE_KEY } from './useUserProfile';

jest.mock('@/infra/api/user.api', () => ({
  userApi: { updateProfile: jest.fn() },
}));

jest.mock('@/application/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

const mockedUpdateProfile = userApi.updateProfile as jest.MockedFunction<
  typeof userApi.updateProfile
>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const updateUserMock = jest.fn().mockResolvedValue(undefined);

const baseProfile: UserProfileResponse = {
  id: 'user-1',
  displayName: 'Old Name',
  avatarUrl: null,
  dmPermission: DmPermission.MEMBERS,
  provider: Provider.GOOGLE,
  createdAt: '2025-03-12T00:00:00.000Z',
};

function makeClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData<UserProfileResponse>(USER_PROFILE_KEY, baseProfile);
  return client;
}

function wrapWith(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
  // useAuthStore(selector) is invoked with `(s) => s.updateUser` — return that.
  mockedUseAuthStore.mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = { updateUser: updateUserMock };
    return selector ? selector(state) : state;
  });
});

describe('useUpdateUserProfile', () => {
  it('optimistically updates the cache during a pending mutation', async () => {
    let resolveServer: (v: UserProfileResponse) => void = () => undefined;
    mockedUpdateProfile.mockImplementation(
      () => new Promise<UserProfileResponse>((res) => { resolveServer = res; }),
    );

    const client = makeClient();
    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({ displayName: 'New Name' });
    });

    await waitFor(() =>
      expect(client.getQueryData<UserProfileResponse>(USER_PROFILE_KEY)?.displayName).toBe(
        'New Name',
      ),
    );

    resolveServer({ ...baseProfile, displayName: 'New Name' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('syncs the auth store on success with the server response', async () => {
    mockedUpdateProfile.mockResolvedValue({
      ...baseProfile,
      dmPermission: DmPermission.NOBODY,
    });

    const client = makeClient();
    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({ dmPermission: DmPermission.NOBODY });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateUserMock).toHaveBeenCalledWith({
      displayName: baseProfile.displayName,
      avatarUrl: baseProfile.avatarUrl,
      dmPermission: DmPermission.NOBODY,
    });
    expect(client.getQueryData<UserProfileResponse>(USER_PROFILE_KEY)?.dmPermission).toBe(
      DmPermission.NOBODY,
    );
  });

  it('rolls back to the previous cache value when the mutation fails', async () => {
    mockedUpdateProfile.mockRejectedValueOnce(new Error('boom'));

    const client = makeClient();
    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: wrapWith(client),
    });

    act(() => {
      result.current.mutate({ displayName: 'Doomed Name' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(client.getQueryData<UserProfileResponse>(USER_PROFILE_KEY)).toEqual(
      baseProfile,
    );
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
