import { AnchorType } from '@localloop/shared-types';
import {
  dmPushConversationKey,
  groupPushConversationKey,
  parseChatPushNotificationData,
} from './chat-push-data';

describe('chat push notification data', () => {
  it('parses group-message payloads', () => {
    expect(
      parseChatPushNotificationData({
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
      type: 'group_message',
      conversationKey: 'group:g-1',
      groupId: 'g-1',
      groupName: 'Morumbi Runners',
      anchorType: AnchorType.NEIGHBORHOOD,
      messageId: 'msg-1',
      senderId: 'user-1',
      senderName: 'Alice',
      senderAvatarUrl: null,
    });
  });

  it('parses direct-message payloads', () => {
    expect(
      parseChatPushNotificationData({
        type: 'direct_message',
        conversationKey: 'dm:user-1',
        peerId: 'user-1',
        peerName: 'Alice',
        peerAvatarUrl: 'https://example.com/a.png',
        messageId: 'dm-1',
      }),
    ).toEqual({
      type: 'direct_message',
      conversationKey: 'dm:user-1',
      peerId: 'user-1',
      peerName: 'Alice',
      peerAvatarUrl: 'https://example.com/a.png',
      messageId: 'dm-1',
    });
  });

  it('rejects old or mismatched payloads', () => {
    expect(
      parseChatPushNotificationData({
        type: 'direct_message',
        peerId: 'user-1',
        messageId: 'dm-1',
      }),
    ).toBeNull();

    expect(
      parseChatPushNotificationData({
        type: 'group_message',
        conversationKey: 'group:g-2',
        groupId: 'g-1',
        groupName: 'Morumbi Runners',
        anchorType: AnchorType.NEIGHBORHOOD,
        messageId: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        senderAvatarUrl: null,
      }),
    ).toBeNull();
  });

  it('builds stable conversation keys', () => {
    expect(groupPushConversationKey('g-1')).toBe('group:g-1');
    expect(dmPushConversationKey('user-1')).toBe('dm:user-1');
  });
});
