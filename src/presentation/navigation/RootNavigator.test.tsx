import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import RootNavigator from './RootNavigator';
import { useAuthStore } from '@/application/stores/auth.store';
import { DmPermission, Provider, User } from '@/domain/user.entity';

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  const Navigator = ({ children }: { children: React.ReactNode }) =>
    ReactLib.createElement(
      ReactLib.Fragment,
      null,
      ReactLib.Children.toArray(children)[0],
    );
  const Screen = ({
    name,
    component: Component,
  }: {
    name: string;
    component: React.ComponentType;
  }) =>
    ReactLib.createElement(
      ReactLib.Fragment,
      null,
      ReactLib.createElement(Text, { testID: 'active-screen' }, name),
      ReactLib.createElement(Component, null),
    );
  return {
    createNativeStackNavigator: () => ({ Navigator, Screen }),
  };
});

jest.mock('./AuthenticatedStack', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return () =>
    ReactLib.createElement(
      Text,
      { testID: 'authenticated-stack' },
      'AuthenticatedStack',
    );
});

jest.mock('../screens/OnboardingScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return () =>
    ReactLib.createElement(
      Text,
      { testID: 'onboarding-screen' },
      'OnboardingScreen',
    );
});

jest.mock('./AuthStack', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return () =>
    ReactLib.createElement(Text, { testID: 'auth-stack' }, 'AuthStack');
});

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

describe('RootNavigator', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isNewUser: false,
    });
  });

  it('shows the loader while initialize() is pending', async () => {
    let resolveInit!: () => void;
    const initialize = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
    );
    useAuthStore.setState({ initialize } as any);

    const { queryByTestId, UNSAFE_getByType } = render(<RootNavigator />);

    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByTestId('active-screen')).toBeNull();

    await act(async () => {
      resolveInit();
    });
  });

  it('routes to the auth stack when the user is not authenticated', async () => {
    useAuthStore.setState({
      isAuthenticated: false,
      isNewUser: false,
      initialize: jest.fn().mockResolvedValue(undefined),
    } as any);

    const { findByTestId } = render(<RootNavigator />);
    const active = await findByTestId('active-screen');
    expect(active).toHaveTextContent('AuthStack');
  });

  it('routes to onboarding when authenticated new user', async () => {
    useAuthStore.setState({
      user: buildUser(),
      isAuthenticated: true,
      isNewUser: true,
      initialize: jest.fn().mockResolvedValue(undefined),
    } as any);

    const { findByTestId } = render(<RootNavigator />);
    const active = await findByTestId('active-screen');
    expect(active).toHaveTextContent('Onboarding');
  });

  it('routes to home when authenticated returning user', async () => {
    useAuthStore.setState({
      user: buildUser(),
      isAuthenticated: true,
      isNewUser: false,
      initialize: jest.fn().mockResolvedValue(undefined),
    } as any);

    const { findByTestId } = render(<RootNavigator />);
    const active = await findByTestId('active-screen');
    expect(active).toHaveTextContent('Home');
  });

  it('calls initialize once on mount', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ initialize } as any);

    render(<RootNavigator />);
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
  });
});
