import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/shared/constants';
import { useAuthStore } from './auth.store';
import { DmPermission, Provider, User } from '@/domain/user.entity';

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

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore();
    (SecureStore.setItemAsync as jest.Mock).mockClear();
    (SecureStore.getItemAsync as jest.Mock).mockClear();
    (SecureStore.deleteItemAsync as jest.Mock).mockClear();
  });

  describe('setAuth', () => {
    it('persists tokens + user to SecureStore and flips isAuthenticated', async () => {
      const user = buildUser();

      await useAuthStore
        .getState()
        .setAuth(user, 'access.token', 'refresh.token', true);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'access.token',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        'refresh.token',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(user),
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isNewUser).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('access.token');
      expect(state.refreshToken).toBe('refresh.token');
    });

    it('defaults isNewUser to false when not provided', async () => {
      await useAuthStore
        .getState()
        .setAuth(buildUser(), 'access', 'refresh');

      expect(useAuthStore.getState().isNewUser).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears SecureStore and resets state', async () => {
      await useAuthStore
        .getState()
        .setAuth(buildUser(), 'access', 'refresh', true);

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isNewUser).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('initialize', () => {
    it('hydrates state from SecureStore when all three keys are set', async () => {
      const user = buildUser({ id: 'hydrated-user' });
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('stored.access')
        .mockResolvedValueOnce('stored.refresh')
        .mockResolvedValueOnce(JSON.stringify(user));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('hydrated-user');
      expect(state.accessToken).toBe('stored.access');
      expect(state.refreshToken).toBe('stored.refresh');
      expect(state.isNewUser).toBe(false);
    });

    it('does not authenticate when any key is missing', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('stored.access')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(buildUser()));

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('swallows SecureStore errors without throwing', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('boom'),
      );
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(useAuthStore.getState().initialize()).resolves.toBeUndefined();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe('setNewUserStatus', () => {
    it('toggles the isNewUser flag', () => {
      useAuthStore.getState().setNewUserStatus(true);
      expect(useAuthStore.getState().isNewUser).toBe(true);

      useAuthStore.getState().setNewUserStatus(false);
      expect(useAuthStore.getState().isNewUser).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('merges partial fields into the current user and persists to SecureStore', async () => {
      const user = buildUser({ displayName: 'Alice' });
      useAuthStore.setState({
        user,
        accessToken: 'access',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });
      (SecureStore.setItemAsync as jest.Mock).mockClear();

      await useAuthStore.getState().updateUser({ displayName: 'Alicia' });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Alicia');
      expect(state.user?.id).toBe(user.id);
      expect(state.accessToken).toBe('access');
      expect(state.isAuthenticated).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify({ ...user, displayName: 'Alicia' }),
      );
    });

    it('is a no-op when no user is currently set', async () => {
      await useAuthStore.getState().updateUser({ displayName: 'ignored' });

      expect(useAuthStore.getState().user).toBeNull();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });
});
