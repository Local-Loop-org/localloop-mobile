import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import {
  DevicePlatform,
  PushProvider,
} from '@localloop/shared-types';
import { STORAGE_KEYS } from '@/shared/constants';
import { parseChatPushNotificationData } from './chat-push-data';

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

const SEEN_MESSAGE_TTL_MS = 5 * 60 * 1000;
const MAX_SEEN_MESSAGES = 200;
let activeConversationKey: string | null = null;
const seenPushMessageIds = new Map<string, number>();

function pruneSeenPushMessages(now = Date.now()): void {
  for (const [messageId, seenAt] of seenPushMessageIds.entries()) {
    if (now - seenAt > SEEN_MESSAGE_TTL_MS) {
      seenPushMessageIds.delete(messageId);
    }
  }

  while (seenPushMessageIds.size > MAX_SEEN_MESSAGES) {
    const oldest = seenPushMessageIds.keys().next().value as string | undefined;
    if (!oldest) return;
    seenPushMessageIds.delete(oldest);
  }
}

export function shouldShowPushNotificationForData(data: unknown): boolean {
  const parsed = parseChatPushNotificationData(data);
  if (!parsed) return true;
  pruneSeenPushMessages();
  if (parsed.conversationKey === activeConversationKey) return false;
  return !seenPushMessageIds.has(parsed.messageId);
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const shouldShow = shouldShowPushNotificationForData(
      notification.request.content.data,
    );
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: shouldShow,
      shouldShowList: shouldShow,
    };
  },
});

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId ?? null;
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
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
}

export async function requestPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const permissions = await Notifications.requestPermissionsAsync();
  return permissions.status;
}

export async function buildPushRegistration(
  tokenOverride?: string,
): Promise<PushRegistration> {
  await ensureAndroidNotificationChannel();

  const id = projectId();
  if (!id) {
    throw new Error('Expo EAS projectId is required for push notifications');
  }

  const token =
    tokenOverride ??
    (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;

  return {
    installationId: await getInstallationId(),
    provider: PushProvider.EXPO,
    platform: devicePlatform(),
    token,
  };
}

export function addPushTokenListener(
  onToken: (token: string) => void,
): Notifications.EventSubscription {
  return Notifications.addPushTokenListener(({ data }) => onToken(data));
}

export function setActivePushConversation(
  conversationKey: string,
): () => void {
  activeConversationKey = conversationKey;
  return () => {
    if (activeConversationKey === conversationKey) {
      activeConversationKey = null;
    }
  };
}

export function markPushMessageSeen(messageId: string): void {
  if (!messageId) return;
  pruneSeenPushMessages();
  seenPushMessageIds.set(messageId, Date.now());
}

export async function dismissPresentedNotificationsForConversation(
  conversationKey: string,
): Promise<void> {
  const notifications = await Notifications.getPresentedNotificationsAsync();
  await Promise.all(
    notifications
      .filter((notification) => {
        const parsed = parseChatPushNotificationData(
          notification.request.content.data,
        );
        return parsed?.conversationKey === conversationKey;
      })
      .map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier),
      ),
  );
}
