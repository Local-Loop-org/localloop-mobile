import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PushProvider } from '@localloop/shared-types';
import { STORAGE_KEYS } from '@/shared/constants';
import {
  buildPushRegistration,
  getInstallationId,
  PushRegistrationError,
} from './push-notifications';

const secureStore = SecureStore as unknown as {
  __store: Map<string, string>;
  setItemAsync: jest.Mock;
  getItemAsync: jest.Mock;
};
const getExpoPushToken =
  Notifications.getExpoPushTokenAsync as jest.MockedFunction<
    typeof Notifications.getExpoPushTokenAsync
  >;

describe('push-notifications infra', () => {
  beforeEach(() => {
    secureStore.__store.clear();
    jest.clearAllMocks();
    getExpoPushToken.mockResolvedValue({
      data: 'ExponentPushToken[test]',
    } as Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>);
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

  it('adds Android setup guidance when Expo token lookup fails', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    getExpoPushToken.mockRejectedValueOnce(
      new Error('Default FirebaseApp is not initialized'),
    );

    try {
      await expect(buildPushRegistration()).rejects.toMatchObject({
        name: 'PushRegistrationError',
        message: expect.stringContaining('google-services.json'),
      } satisfies Partial<PushRegistrationError>);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS });
    }
  });
});
