import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ChatMessage, DirectMessageStatus } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { formatTime } from '@/shared/format/chat';
import { styles } from './styles';
import { QuotedReply } from './QuotedReply';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { FailedMessageRow } from './FailedMessageRow';
import { FailedMessageWarning } from './FailedMessageWarning';

export type OwnBubbleStatus = DirectMessageStatus | 'pending';

interface OwnBubbleProps {
  message: ChatMessage;
  status?: OwnBubbleStatus;
  /** Pass `previousMessage` / `nextMessage` to enable the redesigned layout
   * (run-based corner radii, lastOfRun status row, hidden mid-run timestamps).
   * If neither is provided, the bubble falls back to the legacy tap-to-toggle
   * timestamp + always-tail style. */
  previousMessage?: ChatMessage | null;
  nextMessage?: ChatMessage | null;
  replyTo?: { author: string; text: string };
  onRetry?: () => void;
  onPressReply?: () => void;
}

export function OwnBubble({
  message,
  status,
  previousMessage,
  nextMessage,
  replyTo,
  onRetry,
  onPressReply,
}: OwnBubbleProps) {
  const enhanced =
    previousMessage !== undefined || nextMessage !== undefined;
  const firstOfRun =
    !previousMessage || previousMessage.senderId !== message.senderId;
  const lastOfRun = !nextMessage || nextMessage.senderId !== message.senderId;

  const [tapTimestampVisible, setTapTimestampVisible] = useState(false);
  const isError = status === 'error';
  const isSending = status === 'sending';
  const timestamp = formatTime(message.createdAt);

  const bubbleStyle = enhanced
    ? [
        styles.ownBubble,
        !firstOfRun && styles.ownBubbleMidTop,
        !lastOfRun && styles.ownBubbleMidBottom,
        lastOfRun && styles.ownBubbleTail,
        replyTo && styles.ownBubbleWithReply,
        isSending && styles.ownBubbleSending,
        isError && styles.ownBubbleError,
      ]
    : [styles.ownBubble, styles.ownBubbleTail];

  const handlePressBubble = () => {
    if (enhanced && lastOfRun) return;
    setTapTimestampVisible((v) => !v);
  };

  const renderFooter = () => {
    if (enhanced) {
      if (!lastOfRun) {
        return tapTimestampVisible ? (
          <Text
            style={styles.ownTimestamp}
            testID={`own-timestamp-${message.id}`}
          >
            {timestamp}
          </Text>
        ) : null;
      }
      if (isError && onRetry) {
        return <FailedMessageRow onRetry={onRetry} />;
      }
      return (
        <MessageStatusIndicator
          status={status === 'error' ? null : (status ?? null)}
          timestamp={timestamp}
        />
      );
    }
    // Legacy mode — tap-to-toggle timestamp, no status indicator
    return tapTimestampVisible ? (
      <Text style={styles.ownTimestamp} testID={`own-timestamp-${message.id}`}>
        {timestamp}
      </Text>
    ) : null;
  };

  return (
    <View
      style={[
        styles.ownRow,
        enhanced && firstOfRun && styles.ownRowFirstOfRun,
      ]}
      testID={`own-row-${message.id}`}
    >
      {enhanced && isError && onRetry && (
        <FailedMessageWarning onPress={onRetry} />
      )}
      <View style={styles.ownColumn}>
        <Pressable
          onPress={handlePressBubble}
          accessibilityRole='button'
          accessibilityLabel={
            tapTimestampVisible
              ? 'Ocultar horário da mensagem'
              : 'Mostrar horário da mensagem'
          }
          testID={`own-bubble-${message.id}`}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={bubbleStyle}
          >
            {replyTo && (
              <QuotedReply
                originalAuthor={replyTo.author}
                originalText={replyTo.text}
                me
                onPress={onPressReply}
              />
            )}
            <Text style={styles.ownBubbleText}>{message.content}</Text>
          </LinearGradient>
        </Pressable>
        {renderFooter()}
      </View>
    </View>
  );
}
