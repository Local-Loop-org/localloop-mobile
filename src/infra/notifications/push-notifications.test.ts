import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { PushProvider } from '@localloop/shared-types';
import { STORAGE_KEYS } from '@/shared/constants';
import {
  buildPushRegistration,
  dismissPresentedNotificationsForConversation,
  getInstallationId,
  markPushMessageSeen,
  setActivePushConversation,
  shouldShowPushNotificationForData,
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

  it('suppresses foreground display for the active conversation', () => {
    const clearActive = setActivePushConversation('dm:user-1');

    expect(
      shouldShowPushNotificationForData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
        messageId: 'dm-1',
      }),
    ).toBe(false);

    clearActive();
    expect(
      shouldShowPushNotificationForData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
        messageId: 'dm-1',
      }),
    ).toBe(true);
  });

  it('suppresses foreground display for messages already seen over WS', () => {
    markPushMessageSeen('dm-1');

    expect(
      shouldShowPushNotificationForData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
        messageId: 'dm-1',
      }),
    ).toBe(false);
  });

  it('dismisses presented notifications for a conversation', async () => {
    (
      Notifications.getPresentedNotificationsAsync as jest.MockedFunction<
        typeof Notifications.getPresentedNotificationsAsync
      >
    ).mockResolvedValue([
      {
        date: Date.now(),
        request: {
          identifier: 'notification-1',
          content: {
            title: 'Alice',
            body: 'hi',
            data: {
              type: 'direct_message',
              conversationKey: 'dm:user-1',
              peerId: 'user-1',
              peerName: 'Alice',
              peerAvatarUrl: null,
              messageId: 'dm-1',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification,
      {
        date: Date.now(),
        request: {
          identifier: 'notification-2',
          content: {
            title: 'Bob',
            body: 'hi',
            data: {
              type: 'direct_message',
              conversationKey: 'dm:user-2',
              peerId: 'user-2',
              peerName: 'Bob',
              peerAvatarUrl: null,
              messageId: 'dm-2',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification,
    ]);

    await dismissPresentedNotificationsForConversation('dm:user-1');

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'notification-1',
    );
    expect(Notifications.dismissNotificationAsync).not.toHaveBeenCalledWith(
      'notification-2',
    );
  });
});
