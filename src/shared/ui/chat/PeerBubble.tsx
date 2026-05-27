import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { formatTime } from '@/shared/format/chat';
import type { ChatMessage } from '@localloop/shared-types';
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
  const [timestampVisible, setTimestampVisible] = useState(false);
  const timestamp = formatTime(message.createdAt);
  const avatar = (
    <Avatar
      name={message.senderName}
      uri={message.senderAvatarUrl}
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
        <Pressable
          onPress={() => setTimestampVisible((visible) => !visible)}
          accessibilityRole='button'
          accessibilityLabel={
            timestampVisible
              ? 'Ocultar horario da mensagem'
              : 'Mostrar horario da mensagem'
          }
          testID={`peer-bubble-${message.id}`}
        >
          <View style={styles.peerBubble}>
            <Text style={styles.peerBubbleText}>{message.content}</Text>
          </View>
        </Pressable>
        {timestampVisible ? (
          <Text
            style={styles.peerTimestamp}
            testID={`peer-timestamp-${message.id}`}
          >
            {timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
