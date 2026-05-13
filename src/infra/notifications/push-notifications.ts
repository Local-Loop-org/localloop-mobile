import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import {
  DevicePlatform,
  PushProvider,
} from '@localloop/shared-types';
import { STORAGE_KEYS } from '@/shared/constants';

export interface PushRegistration {
  installationId: string;
  provider: PushProvider;
  platform: DevicePlatform;
  token: string;
}

export class PushPermissionDeniedError extends Error {
  constructor() {
    super('Push notification permission was denied');
    this.name = 'PushPermissionDeniedError';
  }
}

export class PushRegistrationError extends Error {
  readonly originalError: unknown;

  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = 'PushRegistrationError';
    this.originalError = originalError;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

function devicePlatform(): DevicePlatform {
  if (Platform.OS === 'ios') return DevicePlatform.IOS;
  if (Platform.OS === 'android') return DevicePlatform.ANDROID;
  throw new Error('Push notifications are only supported on iOS and Android');
}

function generateInstallationId(): string {
  return `install-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function getInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(
    STORAGE_KEYS.PUSH_INSTALLATION_ID,
  );
  if (existing) return existing;

  const next = generateInstallationId();
  await SecureStore.setItemAsync(STORAGE_KEYS.PUSH_INSTALLATION_ID, next);
  return next;
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
  });
}

export async function preparePushNotifications(): Promise<void> {
  await ensureAndroidNotificationChannel();
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
}

export async function getPermissionState(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.getPermissionsAsync();
}

export async function requestPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const permissions = await Notifications.requestPermissionsAsync();
  return permissions.status;
}

export async function requestPermissionState(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.requestPermissionsAsync();
}

export async function buildPushRegistration(
  tokenOverride?: string,
): Promise<PushRegistration> {
  await preparePushNotifications();

  const id = projectId();
  if (!id) {
    throw new Error('Expo EAS projectId is required for push notifications');
  }

  let token = tokenOverride;
  if (!token) {
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId: id }))
        .data;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const androidHint =
        Platform.OS === 'android'
          ? ' Android builds must include Firebase google-services.json and EAS FCM V1 push credentials.'
          : '';
      throw new PushRegistrationError(
        `Could not get an Expo push token.${androidHint} ${detail}`,
        err,
      );
    }
  }

  return {
    installationId: await getInstallationId(),
    provider: PushProvider.EXPO,
    platform: devicePlatform(),
    token,
  };
}

export function addPushTokenListener(
  onToken: (token: string) => void,
): Notifications.Subscription {
  return Notifications.addPushTokenListener(({ data }) => onToken(data));
}
