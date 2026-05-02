import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DmPermission, Provider } from '@localloop/shared-types';
import ProfileScreen from './index';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';
import { useAuthStore } from '@/application/stores/auth.store';

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

const mockedGetMe = userApi.getMe as jest.MockedFunction<typeof userApi.getMe>;
const mockedUpdateProfile = userApi.updateProfile as jest.MockedFunction<
  typeof userApi.updateProfile
>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

const logoutMock = jest.fn().mockResolvedValue(undefined);
const updateUserMock = jest.fn().mockResolvedValue(undefined);

const profile: UserProfileResponse = {
  id: 'user-1',
  displayName: 'Andrey Viktor',
  avatarUrl: null,
  dmPermission: DmPermission.MEMBERS,
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
  mockedUseAuthStore.mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = {
      user: {
        id: 'user-1',
        displayName: 'Andrey Viktor',
        avatarUrl: null,
        dmPermission: DmPermission.MEMBERS,
      },
      logout: logoutMock,
      updateUser: updateUserMock,
    };
    return selector ? selector(state) : state;
  });
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
