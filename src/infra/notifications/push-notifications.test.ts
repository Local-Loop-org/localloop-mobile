import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { PushProvider } from '@localloop/shared-types';
import { STORAGE_KEYS } from '@/shared/constants';
import {
  buildPushRegistration,
  getInstallationId,
} from './push-notifications';

const secureStore = SecureStore as unknown as {
  __store: Map<string, string>;
  setItemAsync: jest.Mock;
  getItemAsync: jest.Mock;
};

describe('push-notifications infra', () => {
  beforeEach(() => {
    secureStore.__store.clear();
    jest.clearAllMocks();
  });

  it('persists one stable installation id', async () => {
    const first = await getInstallationId();
    const second = await getInstallationId();

    expect(first).toBe(second);
    expect(secureStore.setItemAsync).toHaveBeenCalledTimes(1);
    expect(secureStore.__store.get(STORAGE_KEYS.PUSH_INSTALLATION_ID)).toBe(
      first,
    );
  });

  it('builds an Expo registration payload with projectId token lookup', async () => {
    const registration = await buildPushRegistration();

    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'test-project-id',
    });
    expect(registration.provider).toBe(PushProvider.EXPO);
    expect(registration.token).toBe('ExponentPushToken[test]');
  });
});
