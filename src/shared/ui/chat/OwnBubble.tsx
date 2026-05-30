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
import { SwipeableBubble } from './SwipeableBubble';

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
  /** When provided, the bubble is wrapped in a swipe-to-reply gesture
   * (swipes left, reveals a reply icon, fires this callback past the
   * 56px threshold). Opt-in — pass nothing to disable. */
  onSwipeReply?: () => void;
  /** Long-press opens the per-message ActionSheet (reply / edit / delete). */
  onLongPress?: () => void;
}

export function OwnBubble({
  message,
  status,
  previousMessage,
  nextMessage,
  replyTo,
  onRetry,
  onPressReply,
  onSwipeReply,
  onLongPress,
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

  const edited = !!message.editedAt;

  const renderFooter = () => {
    if (enhanced) {
      if (!lastOfRun) {
        return tapTimestampVisible ? (
          <Text
            style={styles.ownTimestamp}
            testID={`own-timestamp-${message.id}`}
          >
            {timestamp}
            {edited && (
              <Text
                style={styles.editedSuffix}
                testID={`own-edited-suffix-${message.id}`}
              >
                {' '}editado
              </Text>
            )}
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
          edited={edited}
        />
      );
    }
    // Legacy mode — tap-to-toggle timestamp, no status indicator
    return tapTimestampVisible ? (
      <Text style={styles.ownTimestamp} testID={`own-timestamp-${message.id}`}>
        {timestamp}
        {edited && (
          <Text
            style={styles.editedSuffix}
            testID={`own-edited-suffix-${message.id}`}
          >
            {' '}editado
          </Text>
        )}
      </Text>
    ) : null;
  };

  const row = (
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
          onLongPress={onLongPress}
          accessibilityRole='button'
          accessibilityLabel={
            tapTimestampVisible
              ? 'Ocultar horário da mensagem'
              : 'Mostrar horário da mensagem'
          }
          accessibilityHint={
            onLongPress ? 'Toque longo para mais ações' : undefined
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

  if (onSwipeReply) {
    return (
      <SwipeableBubble me onSwipeReply={onSwipeReply}>
        {row}
      </SwipeableBubble>
    );
  }
  return row;
}
