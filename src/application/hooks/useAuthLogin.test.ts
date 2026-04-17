import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthLogin } from './useAuthLogin';
import { useAuthStore } from '@/application/stores/auth.store';
import { authApi } from '@/infra/api/auth.api';
import { supabase } from '@/infra/supabase/supabase';
import { DmPermission, Provider, User } from '@/domain/user.entity';

jest.mock('@/infra/api/auth.api', () => ({
  authApi: {
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
  },
}));

const resetStore = () =>
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isNewUser: false,
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

describe('useAuthLogin', () => {
  let alertSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('handleGoogleLogin', () => {
    it('sets auth state when the full OAuth flow succeeds', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.supabase.co/authorize?...' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'locallooptest://auth/callback#access_token=sb.access&refresh_token=sb.refresh',
      });
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'sb.access' } },
        error: null,
      });
      const user = buildUser();
      (authApi.loginWithGoogle as jest.Mock).mockResolvedValue({
        user,
        accessToken: 'backend.access',
        refreshToken: 'backend.refresh',
        isNewUser: true,
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleGoogleLogin();
      });

      expect(authApi.loginWithGoogle).toHaveBeenCalledWith('sb.access');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isNewUser).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('backend.access');
    });

    it('shows an alert when Supabase signInWithOAuth returns an error', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('oauth failed'),
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleGoogleLogin();
      });

      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Falha ao fazer login com Google');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('does nothing when the browser session is cancelled', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.supabase.co/authorize?...' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'cancel',
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleGoogleLogin();
      });

      expect(authApi.loginWithGoogle).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('bails out when the callback URL has no token fragment', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.supabase.co/authorize?...' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'locallooptest://auth/callback',
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleGoogleLogin();
      });

      expect(authApi.loginWithGoogle).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleAppleLogin', () => {
    it('sets auth state when Supabase returns a session', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'sb.apple.access' } },
      });
      const user = buildUser({ provider: Provider.APPLE });
      (authApi.loginWithApple as jest.Mock).mockResolvedValue({
        user,
        accessToken: 'backend.access',
        refreshToken: 'backend.refresh',
        isNewUser: false,
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleAppleLogin();
      });

      expect(authApi.loginWithApple).toHaveBeenCalledWith('sb.apple.access');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isNewUser).toBe(false);
    });

    it('alerts when Supabase signInWithOAuth errors', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('apple failed'),
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleAppleLogin();
      });

      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Falha ao fazer login com Apple');
    });

    it('does nothing when there is no session after sign-in', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuthLogin());
      await act(async () => {
        await result.current.handleAppleLogin();
      });

      expect(authApi.loginWithApple).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  it('toggles loading while the request is in flight', async () => {
    let resolveOauth!: (value: unknown) => void;
    (supabase.auth.signInWithOAuth as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOauth = resolve;
        }),
    );

    const { result } = renderHook(() => useAuthLogin());

    let pending: Promise<void>;
    act(() => {
      pending = result.current.handleGoogleLogin();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveOauth({ data: null, error: new Error('abort') });
      await pending;
    });
    expect(result.current.loading).toBe(false);
  });
});
