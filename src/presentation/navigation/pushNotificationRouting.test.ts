import * as Notifications from 'expo-notifications';
import { AnchorType } from '@localloop/shared-types';
import {
  handlePushNotificationResponse,
  registerPushNotificationRouting,
  routeFromPushNotificationData,
  setPushNotificationRoutingEnabled,
} from './pushNotificationRouting';
import { rootNavigationRef } from './navigationRef';
import { RootRoutes, StackRoutes } from './routes';

jest.mock('./navigationRef', () => ({
  rootNavigationRef: {
    isReady: jest.fn(),
    navigate: jest.fn(),
  },
}));

const mockedRootNavigationRef = rootNavigationRef as unknown as {
  isReady: jest.Mock;
  navigate: jest.Mock;
};

function responseWithData(
  data: Record<string, unknown>,
): Notifications.NotificationResponse {
  return {
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: {
      date: Date.now(),
      request: {
        identifier: 'notification-1',
        content: {
          title: 'Alice',
          body: 'hi',
          data,
        },
        trigger: null,
      },
    },
  } as Notifications.NotificationResponse;
}

describe('push notification routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRootNavigationRef.isReady.mockReturnValue(true);
    setPushNotificationRoutingEnabled(false);
  });

  it('maps a direct-message payload to DmChat', () => {
    expect(
      routeFromPushNotificationData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
        messageId: 'dm-1',
      }),
    ).toEqual({
      name: StackRoutes.DmChat,
      params: {
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
      },
    });
  });

  it('maps a group-message payload to GroupChat with unknown role', () => {
    expect(
      routeFromPushNotificationData({
        type: 'group_message',
        conversationKey: 'group:g-1',
        groupId: 'g-1',
        groupName: 'Morumbi Runners',
        anchorType: AnchorType.NEIGHBORHOOD,
        messageId: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        senderAvatarUrl: null,
      }),
    ).toEqual({
      name: StackRoutes.GroupChat,
      params: {
        groupId: 'g-1',
        groupName: 'Morumbi Runners',
        anchorType: AnchorType.NEIGHBORHOOD,
        myRole: null,
      },
    });
  });

  it('queues a tapped push until routing is enabled', () => {
    handlePushNotificationResponse(
      responseWithData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: null,
        messageId: 'dm-1',
      }),
    );

    expect(mockedRootNavigationRef.navigate).not.toHaveBeenCalled();

    setPushNotificationRoutingEnabled(true);

    expect(mockedRootNavigationRef.navigate).toHaveBeenCalledWith(
      RootRoutes.Home,
      {
        screen: StackRoutes.DmChat,
        params: {
          peerId: 'user-1',
          peerName: 'Alice',
          peerAvatarUrl: null,
        },
      },
    );
  });

  it('registers live and cold-start notification responses', () => {
    const response = responseWithData({
      type: 'direct_message',
      conversationKey: 'dm:user-1',
      peerId: 'user-1',
      peerName: 'Alice',
      peerAvatarUrl: null,
      messageId: 'dm-1',
    });
    (
      Notifications.getLastNotificationResponse as jest.MockedFunction<
        typeof Notifications.getLastNotificationResponse
      >
    ).mockReturnValue(response);
    setPushNotificationRoutingEnabled(true);

    registerPushNotificationRouting();

    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    expect(mockedRootNavigationRef.navigate).toHaveBeenCalledWith(
      RootRoutes.Home,
      expect.objectContaining({ screen: StackRoutes.DmChat }),
    );
  });
});
