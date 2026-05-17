import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/shared/theme';
import { formatTime } from '@/shared/format/chat';
import type { ChatMessage } from '@/infra/api/messages.api';
import { styles } from './styles';

export function OwnBubble({ message }: { message: ChatMessage }) {
  return (
    <View style={styles.ownRow}>
      <View style={styles.ownColumn}>
        <LinearGradient
          colors={[colors.primary, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ownBubble}
        >
          <Text style={styles.ownBubbleText}>{message.content}</Text>
        </LinearGradient>
        <Text style={styles.ownTimestamp}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}
