import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ChatMessage, DirectMessageStatus } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { formatTime } from '@/shared/format/chat';
import { styles } from './styles';

interface OwnBubbleProps {
  message: ChatMessage;
  status?: DirectMessageStatus;
}

export function OwnBubble({ message }: OwnBubbleProps) {
  const [timestampVisible, setTimestampVisible] = useState(false);
  const timestamp = formatTime(message.createdAt);

  return (
    <View style={styles.ownRow}>
      <View style={styles.ownColumn}>
        <Pressable
          onPress={() => setTimestampVisible((visible) => !visible)}
          accessibilityRole='button'
          accessibilityLabel={
            timestampVisible
              ? 'Ocultar horario da mensagem'
              : 'Mostrar horario da mensagem'
          }
          testID={`own-bubble-${message.id}`}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ownBubble}
          >
            <Text style={styles.ownBubbleText}>{message.content}</Text>
          </LinearGradient>
        </Pressable>
        {timestampVisible ? (
          <Text
            style={styles.ownTimestamp}
            testID={`own-timestamp-${message.id}`}
          >
            {timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
