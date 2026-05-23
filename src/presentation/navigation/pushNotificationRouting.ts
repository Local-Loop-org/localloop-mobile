import * as Notifications from 'expo-notifications';
import type { ChatPushNotificationData } from '@localloop/shared-types';
import { parseChatPushNotificationData } from '@/infra/notifications/chat-push-data';
import { RootRoutes, StackRoutes } from './routes';
import { rootNavigationRef } from './navigationRef';
import type { AuthenticatedStackParamList } from './types';

type PushNotificationRoute =
  | {
      name: typeof StackRoutes.GroupChat;
      params: AuthenticatedStackParamList['GroupChat'];
    }
  | {
      name: typeof StackRoutes.DmChat;
      params: AuthenticatedStackParamList['DmChat'];
    };

let pendingRoute: PushNotificationRoute | null = null;
let routingEnabled = false;

export function routeFromPushNotificationData(
  data: unknown,
): PushNotificationRoute | null {
  const parsed = parseChatPushNotificationData(data);
  if (!parsed) return null;
  return routeFromParsedData(parsed);
}

function routeFromParsedData(
  data: ChatPushNotificationData,
): PushNotificationRoute {
  if (data.type === 'group_message') {
    return {
      name: StackRoutes.GroupChat,
      params: {
        groupId: data.groupId,
        groupName: data.groupName,
        anchorType: data.anchorType,
        myRole: null,
      },
    };
  }

  return {
    name: StackRoutes.DmChat,
    params: {
      peerId: data.peerId,
      peerName: data.peerName,
      peerAvatarUrl: data.peerAvatarUrl,
    },
  };
}

export function setPushNotificationRoutingEnabled(enabled: boolean): void {
  routingEnabled = enabled;
  flushPendingPushNotificationRoute();
}

export function flushPendingPushNotificationRoute(): void {
  if (!routingEnabled) return;
  if (!pendingRoute) return;
  if (!rootNavigationRef.isReady()) return;

  const route = pendingRoute;
  pendingRoute = null;
  if (route.name === StackRoutes.GroupChat) {
    rootNavigationRef.navigate(RootRoutes.Home, {
      screen: StackRoutes.GroupChat,
      params: route.params,
    });
    return;
  }

  rootNavigationRef.navigate(RootRoutes.Home, {
    screen: StackRoutes.DmChat,
    params: route.params,
  });
}

export function handlePushNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const route = routeFromPushNotificationData(
    response.notification.request.content.data,
  );
  if (!route) return;

  pendingRoute = route;
  flushPendingPushNotificationRoute();
}

export function registerPushNotificationRouting(): Notifications.EventSubscription {
  const response = Notifications.getLastNotificationResponse();
  if (response) {
    handlePushNotificationResponse(response);
  }

  return Notifications.addNotificationResponseReceivedListener(
    handlePushNotificationResponse,
  );
}
