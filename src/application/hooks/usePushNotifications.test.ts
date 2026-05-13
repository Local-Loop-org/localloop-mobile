import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  DmPermission,
  Provider,
  PushPermissionStatus,
} from '@localloop/shared-types';
import { useAuthStore } from '@/application/stores/auth.store';
import { pushApi } from '@/infra/api/push.api';
import {
  PushPermissionDeniedError,
  useHomePushBootstrap,
  usePushNotifications,
} from './usePushNotifications';

jest.mock('@/infra/api/push.api', () => ({
  pushApi: {
    registerCurrentDevice: jest.fn(),
    disableCurrentDevice: jest.fn(),
    updatePermission: jest.fn(),
  },
}));

const mockedRegister = pushApi.registerCurrentDevice as jest.MockedFunction<
  typeof pushApi.registerCurrentDevice
>;
const mockedUpdatePermission = pushApi.updatePermission as jest.MockedFunction<
  typeof pushApi.updatePermission
>;
const mockedGetPermissions =
  Notifications.getPermissionsAsync as jest.MockedFunction<
    typeof Notifications.getPermissionsAsync
  >;
const mockedRequestPermissions =
  Notifications.requestPermissionsAsync as jest.MockedFunction<
    typeof Notifications.requestPermissionsAsync
  >;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client }, children)
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    accessToken: 'token-1',
    refreshToken: 'refresh-1',
    isAuthenticated: true,
    isNewUser: false,
    user: {
      id: 'user-1',
      displayName: 'Andrey',
      avatarUrl: null,
      dmPermission: DmPermission.MEMBERS,
      pushPermissionStatus: null,
      provider: Provider.GOOGLE,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });
  mockedRegister.mockResolvedValue(undefined);
  mockedUpdatePermission.mockResolvedValue(undefined);
});

describe('usePushNotifications', () => {
  it('Home bootstrap requests permission once and registers when granted', async () => {
    mockedGetPermissions.mockResolvedValueOnce({
      status: Notifications.PermissionStatus.UNDETERMINED,
    } as Notifications.NotificationPermissionsStatus);
    mockedRequestPermissions.mockResolvedValueOnce({
      status: Notifications.PermissionStatus.GRANTED,
    } as Notifications.NotificationPermissionsStatus);

    renderHook(() => useHomePushBootstrap(null, true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedRegister).toHaveBeenCalledTimes(1));
    expect(mockedRequestPermissions).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.pushPermissionStatus).toBe(
      PushPermissionStatus.GRANTED,
    );
  });

  it('Home bootstrap syncs denied permission without prompting again', async () => {
    mockedGetPermissions.mockResolvedValueOnce({
      status: Notifications.PermissionStatus.DENIED,
    } as Notifications.NotificationPermissionsStatus);

    renderHook(() => useHomePushBootstrap(null, true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockedUpdatePermission).toHaveBeenCalledWith(
        PushPermissionStatus.DENIED,
      ),
    );
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
  });

  it('Profile disable writes disabled status', async () => {
    const { result } = renderHook(() => usePushNotifications(), {
      wrapper: makeWrapper(),
    });

    await result.current.disableFromProfile();

    expect(mockedUpdatePermission).toHaveBeenCalledWith(
      PushPermissionStatus.DISABLED,
    );
  });

  it('Profile enable syncs denied and throws a specific denial error', async () => {
    mockedGetPermissions.mockResolvedValueOnce({
      status: Notifications.PermissionStatus.DENIED,
    } as Notifications.NotificationPermissionsStatus);
    mockedRequestPermissions.mockResolvedValueOnce({
      status: Notifications.PermissionStatus.DENIED,
    } as Notifications.NotificationPermissionsStatus);
    const { result } = renderHook(() => usePushNotifications(), {
      wrapper: makeWrapper(),
    });

    await expect(result.current.enableFromProfile()).rejects.toThrow(
      PushPermissionDeniedError,
    );
    expect(mockedUpdatePermission).toHaveBeenCalledWith(
      PushPermissionStatus.DENIED,
    );
  });
});
