import MockAdapter from 'axios-mock-adapter';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/shared/constants';
import { useAuthStore } from '@/application/stores/auth.store';
import { apiClient } from './api-client';

const resetStore = () =>
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isNewUser: false,
  });

describe('apiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    resetStore();
    (SecureStore.setItemAsync as jest.Mock).mockClear();
    (SecureStore.deleteItemAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('attaches the current access token as a Bearer header', async () => {
    useAuthStore.setState({ accessToken: 'current.token' });
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer current.token');
      return [200, { ok: true }];
    });

    await apiClient.get('/ping');
  });

  it('does not attach an Authorization header when no token is set', async () => {
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { ok: true }];
    });

    await apiClient.get('/ping');
  });

  describe('401 interceptor', () => {
    it('refreshes the token, retries the original request, and persists the new token', async () => {
      useAuthStore.setState({
        accessToken: 'stale',
        refreshToken: 'valid.refresh',
      });

      let firstCall = true;
      mock.onGet('/protected').reply(() => {
        if (firstCall) {
          firstCall = false;
          return [401, { error: 'TOKEN_EXPIRED' }];
        }
        return [200, { data: 'secret' }];
      });
      mock.onPost('/auth/refresh').reply(200, { accessToken: 'fresh' });

      const response = await apiClient.get('/protected');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'secret' });
      expect(useAuthStore.getState().accessToken).toBe('fresh');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'fresh',
      );
    });

    it('logs out when the refresh endpoint itself returns 401', async () => {
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout');
      useAuthStore.setState({
        accessToken: 'stale',
        refreshToken: 'expired.refresh',
      });

      mock.onGet('/protected').reply(401);
      mock.onPost('/auth/refresh').reply(401);

      await expect(apiClient.get('/protected')).rejects.toBeDefined();
      expect(logoutSpy).toHaveBeenCalled();
      logoutSpy.mockRestore();
    });

    it('logs out when there is no refresh token available', async () => {
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout');
      useAuthStore.setState({ accessToken: 'stale', refreshToken: null });

      mock.onGet('/protected').reply(401);

      await expect(apiClient.get('/protected')).rejects.toBeDefined();
      expect(logoutSpy).toHaveBeenCalled();
      logoutSpy.mockRestore();
    });

    it('queues concurrent 401s and replays them with the refreshed token', async () => {
      useAuthStore.setState({
        accessToken: 'stale',
        refreshToken: 'valid.refresh',
      });

      const calls: string[] = [];
      mock.onGet('/a').reply((config) => {
        const auth = config.headers?.Authorization;
        calls.push(`a:${auth}`);
        return auth === 'Bearer fresh' ? [200, { r: 'a' }] : [401, {}];
      });
      mock.onGet('/b').reply((config) => {
        const auth = config.headers?.Authorization;
        calls.push(`b:${auth}`);
        return auth === 'Bearer fresh' ? [200, { r: 'b' }] : [401, {}];
      });

      let refreshCalls = 0;
      mock.onPost('/auth/refresh').reply(() => {
        refreshCalls += 1;
        return [200, { accessToken: 'fresh' }];
      });

      const [resA, resB] = await Promise.all([
        apiClient.get('/a'),
        apiClient.get('/b'),
      ]);

      expect(resA.data).toEqual({ r: 'a' });
      expect(resB.data).toEqual({ r: 'b' });
      expect(refreshCalls).toBe(1);
    });

    it('does not retry the same request twice (breaks infinite loop on 401 after refresh)', async () => {
      useAuthStore.setState({
        accessToken: 'stale',
        refreshToken: 'valid.refresh',
      });

      let attempts = 0;
      mock.onGet('/protected').reply(() => {
        attempts += 1;
        return [401, {}];
      });
      mock.onPost('/auth/refresh').reply(200, { accessToken: 'fresh' });

      await expect(apiClient.get('/protected')).rejects.toBeDefined();
      expect(attempts).toBe(2);
    });

    it('passes through non-401 errors without refresh', async () => {
      useAuthStore.setState({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      mock.onGet('/server-error').reply(500, { error: 'boom' });

      await expect(apiClient.get('/server-error')).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });
});
