import {
  AnchorType,
  type ChatPushNotificationData,
} from '@localloop/shared-types';

const ANCHOR_TYPES = new Set<string>(Object.values(AnchorType));

export function groupPushConversationKey(groupId: string): `group:${string}` {
  return `group:${groupId}`;
}

export function dmPushConversationKey(peerId: string): `dm:${string}` {
  return `dm:${peerId}`;
}

function stringField(
  data: Record<string, unknown>,
  key: string,
): string | null {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableStringField(
  data: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = data[key];
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : undefined;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  return data as Record<string, unknown>;
}

export function parseChatPushNotificationData(
  data: unknown,
): ChatPushNotificationData | null {
  const record = asRecord(data);
  if (!record) return null;

  if (record.type === 'group_message') {
    const groupId = stringField(record, 'groupId');
    const groupName = stringField(record, 'groupName');
    const conversationKey = stringField(record, 'conversationKey');
    const anchorType = stringField(record, 'anchorType');
    const messageId = stringField(record, 'messageId');
    const senderId = stringField(record, 'senderId');
    const senderName = stringField(record, 'senderName');
    const senderAvatarUrl = nullableStringField(record, 'senderAvatarUrl');

    if (
      !groupId ||
      !groupName ||
      conversationKey !== groupPushConversationKey(groupId) ||
      !anchorType ||
      !ANCHOR_TYPES.has(anchorType) ||
      !messageId ||
      !senderId ||
      !senderName ||
      senderAvatarUrl === undefined
    ) {
      return null;
    }

    return {
      type: 'group_message',
      conversationKey,
      groupId,
      groupName,
      anchorType: anchorType as AnchorType,
      messageId,
      senderId,
      senderName,
      senderAvatarUrl,
    };
  }

  if (record.type === 'direct_message') {
    const peerId = stringField(record, 'peerId');
    const peerName = stringField(record, 'peerName');
    const peerAvatarUrl = nullableStringField(record, 'peerAvatarUrl');
    const conversationKey = stringField(record, 'conversationKey');
    const messageId = stringField(record, 'messageId');

    if (
      !peerId ||
      !peerName ||
      peerAvatarUrl === undefined ||
      conversationKey !== dmPushConversationKey(peerId) ||
      !messageId
    ) {
      return null;
    }

    return {
      type: 'direct_message',
      conversationKey,
      peerId,
      peerName,
      peerAvatarUrl,
      messageId,
    };
  }

  return null;
}
