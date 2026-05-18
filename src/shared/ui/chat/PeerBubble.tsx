import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { formatTime } from '@/shared/format/chat';
import type { ChatMessage } from '@/infra/api/messages.api';
import { styles, layoutDimensions } from './styles';

interface PeerBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
  onPressAvatar?: () => void;
}

export function PeerBubble({
  message,
  showSenderName = true,
  onPressAvatar,
}: PeerBubbleProps) {
  const avatar = (
    <Avatar
      name={message.senderName}
      uri={message.senderAvatar}
      size={layoutDimensions.peerAvatar}
    />
  );

  return (
    <View style={styles.peerRow}>
      {onPressAvatar ? (
        <Pressable
          onPress={onPressAvatar}
          accessibilityRole='button'
          accessibilityLabel={`Abrir conversa com ${message.senderName}`}
          hitSlop={8}
          testID={`peer-avatar-${message.senderId}`}
        >
          {avatar}
        </Pressable>
      ) : (
        avatar
      )}
      <View style={styles.peerColumn}>
        {showSenderName && (
          <View style={styles.peerNameRow}>
            <Text style={styles.peerName}>{message.senderName}</Text>
          </View>
        )}
        <View style={styles.peerBubble}>
          <Text style={styles.peerBubbleText}>{message.content}</Text>
        </View>
        <Text style={styles.peerTimestamp}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
