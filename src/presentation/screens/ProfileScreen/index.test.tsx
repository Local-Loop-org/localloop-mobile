import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DmPermission,
  Provider,
  PushPermissionStatus,
} from '@localloop/shared-types';
import ProfileScreen from './index';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';
import { useAuthStore } from '@/application/stores/auth.store';
import { usePreferencesStore } from '@/application/stores/preferences.store';
import { useDmExceptions } from '@/application/hooks/useDmExceptions/useDmExceptions';
import { useRemoveDmException } from '@/application/hooks/useRemoveDmException/useRemoveDmException';
import { usePushNotifications } from '@/application/hooks/usePushNotifications/usePushNotifications';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('@/infra/api/user.api', () => ({
  userApi: {
    getMe: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('@/application/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/application/hooks/usePushNotifications/usePushNotifications', () => ({
  PushPermissionDeniedError: class PushPermissionDeniedError extends Error {},
  usePushNotifications: jest.fn(),
}));

jest.mock('@/application/hooks/useDmExceptions/useDmExceptions', () => ({
  useDmExceptions: jest.fn(),
}));

jest.mock('@/application/hooks/useRemoveDmException/useRemoveDmException', () => ({
  useRemoveDmException: jest.fn(),
}));

const mockedGetMe = userApi.getMe as jest.MockedFunction<typeof userApi.getMe>;
const mockedUpdateProfile = userApi.updateProfile as jest.MockedFunction<
  typeof userApi.updateProfile
>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseDmExceptions = useDmExceptions as jest.MockedFunction<
  typeof useDmExceptions
>;
const mockedUseRemoveDmException =
  useRemoveDmException as jest.MockedFunction<typeof useRemoveDmException>;
const mockedUsePushNotifications = usePushNotifications as jest.MockedFunction<
  typeof usePushNotifications
>;

const logoutMock = jest.fn().mockResolvedValue(undefined);
const updateUserMock = jest.fn().mockResolvedValue(undefined);
const enableFromProfileMock = jest.fn().mockResolvedValue(undefined);
const disableFromProfileMock = jest.fn().mockResolvedValue(undefined);
const removeExceptionMutateMock = jest.fn();
const setDiscoveryRadiusKmMock = jest.fn().mockResolvedValue(undefined);

const profile: UserProfileResponse = {
  id: 'user-1',
  displayName: 'Andrey Viktor',
  avatarUrl: null,
  dmPermission: DmPermission.MEMBERS,
  pushPermissionStatus: PushPermissionStatus.GRANTED,
  provider: Provider.GOOGLE,
  createdAt: '2025-03-12T00:00:00.000Z',
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  usePreferencesStore.setState({
    discoveryRadiusKm: 25,
    setDiscoveryRadiusKm: setDiscoveryRadiusKmMock,
  });
  mockedUseAuthStore.mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = {
      user: {
        id: 'user-1',
        displayName: 'Andrey Viktor',
        avatarUrl: null,
        dmPermission: DmPermission.MEMBERS,
        pushPermissionStatus: PushPermissionStatus.GRANTED,
      },
      logout: logoutMock,
      updateUser: updateUserMock,
    };
    return selector ? selector(state) : state;
  });
  mockedUsePushNotifications.mockReturnValue({
    bootstrapIfUnasked: jest.fn(),
    enableFromProfile: enableFromProfileMock,
    disableFromProfile: disableFromProfileMock,
    listenForTokenChanges: jest.fn(),
    isRegistering: false,
    isUpdatingPermission: false,
  });
  mockedUseDmExceptions.mockReturnValue({
    exceptions: [
      {
        peerId: 'u-ana',
        displayName: 'Ana Permitida',
        avatarUrl: null,
        createdAt: '2026-05-18T10:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: jest.fn(),
    query: {} as never,
  });
  mockedUseRemoveDmException.mockReturnValue({
    mutate: removeExceptionMutateMock,
    isPending: false,
  } as never);
});

describe('ProfileScreen', () => {
  it('renders the centered hero with the membership meta line', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { getByText, findByText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    expect(getByText('Andrey Viktor')).toBeTruthy();
    expect(await findByText(/MEMBRO DESDE/)).toBeTruthy();
  });

  it('selects a DM permission and triggers an updateProfile mutation', async () => {
    mockedGetMe.mockResolvedValue(profile);
    mockedUpdateProfile.mockResolvedValue({
      ...profile,
      dmPermission: DmPermission.NOBODY,
    });

    const { getByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());
    fireEvent.press(getByLabelText('Ninguém'));

    await waitFor(() =>
      expect(mockedUpdateProfile).toHaveBeenCalledWith({
        dmPermission: DmPermission.NOBODY,
      }),
    );
  });

  it('lists real DM exceptions under restricted DM permissions', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { findByText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    expect(await findByText('Ana Permitida')).toBeTruthy();
    expect(mockedUseDmExceptions).toHaveBeenCalledWith({ enabled: true });
  });

  it('revokes a DM exception through the remove mutation', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { findByText, getByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await findByText('Ana Permitida');
    fireEvent.press(getByLabelText('Remover Ana Permitida'));

    expect(removeExceptionMutateMock).toHaveBeenCalledWith(
      'u-ana',
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('hides DM exceptions when default permission is Todos', async () => {
    mockedGetMe.mockResolvedValue({
      ...profile,
      dmPermission: DmPermission.EVERYONE,
    });

    const { queryByText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());
    await waitFor(() => expect(queryByText('Ana Permitida')).toBeNull());
    expect(mockedUseDmExceptions).toHaveBeenCalledWith({ enabled: false });
  });

  it('logout button calls auth-store logout', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { getAllByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());

    // Two Sair affordances: header icon button + outlined button.
    const logoutButtons = getAllByLabelText('Sair');
    fireEvent.press(logoutButtons[0]);
    expect(logoutMock).toHaveBeenCalled();
  });

  it('notification toggle disables notifications through the push hook', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { getByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());
    fireEvent(getByLabelText('Receber notificações'), 'valueChange', false);

    await waitFor(() => expect(disableFromProfileMock).toHaveBeenCalled());
  });

  it('commits the discovery radius preference once when a preset is selected', async () => {
    mockedGetMe.mockResolvedValue(profile);

    const { getByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());
    fireEvent.press(getByLabelText('Definir raio para 5 km'));

    expect(setDiscoveryRadiusKmMock).toHaveBeenCalledTimes(1);
    expect(setDiscoveryRadiusKmMock).toHaveBeenCalledWith(5);
  });

  it('Excluir conta opens the "em breve" alert', async () => {
    mockedGetMe.mockResolvedValue(profile);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    const { getByLabelText } = render(<ProfileScreen />, {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockedGetMe).toHaveBeenCalled());
    fireEvent.press(getByLabelText('Excluir conta permanentemente'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Excluir conta',
      expect.stringContaining('não está disponível'),
    );

    alertSpy.mockRestore();
  });
});
