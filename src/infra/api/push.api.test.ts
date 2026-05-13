import MockAdapter from 'axios-mock-adapter';
import {
  DevicePlatform,
  PushPermissionStatus,
  PushProvider,
} from '@localloop/shared-types';
import { apiClient } from './api-client';
import { pushApi } from './push.api';

describe('pushApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  it('registerCurrentDevice PUTs the provider-agnostic device payload', async () => {
    const body = {
      installationId: 'install-123',
      provider: PushProvider.EXPO,
      platform: DevicePlatform.IOS,
      token: 'ExponentPushToken[abc123]',
    };
    mock.onPut('/users/me/push-devices/current').reply((config) => {
      expect(JSON.parse(config.data)).toEqual(body);
      return [200, { status: 'registered' }];
    });

    await expect(pushApi.registerCurrentDevice(body)).resolves.toBeUndefined();
  });

  it('disableCurrentDevice DELETEs with installation and provider params', async () => {
    mock.onDelete('/users/me/push-devices/current').reply((config) => {
      expect(config.params).toEqual({
        installationId: 'install-123',
        provider: PushProvider.EXPO,
      });
      return [204];
    });

    await expect(
      pushApi.disableCurrentDevice({
        installationId: 'install-123',
        provider: PushProvider.EXPO,
      }),
    ).resolves.toBeUndefined();
  });

  it('updatePermission PATCHes the user-level status', async () => {
    mock.onPatch('/users/me/push-permission').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        status: PushPermissionStatus.DISABLED,
      });
      return [204];
    });

    await expect(
      pushApi.updatePermission(PushPermissionStatus.DISABLED),
    ).resolves.toBeUndefined();
  });
});
