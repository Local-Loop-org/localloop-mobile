import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { formatTime } from '@/shared/format/chat';
import type { ChatMessage } from '@/infra/api/messages.api';
import { styles, layoutDimensions } from './styles';

interface PeerBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
}

export function PeerBubble({ message, showSenderName = true }: PeerBubbleProps) {
  return (
    <View style={styles.peerRow}>
      <Avatar
        name={message.senderName}
        uri={message.senderAvatar}
        size={layoutDimensions.peerAvatar}
      />
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
