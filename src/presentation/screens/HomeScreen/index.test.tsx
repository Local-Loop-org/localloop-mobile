import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from './index';
import { useAuthStore } from '@/application/stores/auth.store';
import { DmPermission, Provider, User } from '@/domain/user.entity';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  providerId: 'provider-1',
  provider: Provider.GOOGLE,
  displayName: 'Alice',
  avatarUrl: null,
  geohash: null,
  dmPermission: DmPermission.MEMBERS,
  isActive: true,
  lastSeenAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('HomeScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: true,
      isNewUser: false,
    });
  });

  it("renders the current user's display name", () => {
    useAuthStore.setState({ user: buildUser({ displayName: 'Alice' }) });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Olá, Alice!')).toBeTruthy();
  });

  it('wires the logout button to the store logout action', () => {
    useAuthStore.setState({ user: buildUser() });
    const logoutSpy = jest
      .spyOn(useAuthStore.getState(), 'logout')
      .mockResolvedValue(undefined);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Sair da Conta'));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    logoutSpy.mockRestore();
  });
});
