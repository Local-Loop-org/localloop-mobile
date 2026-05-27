import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Avatar from '@/shared/ui/Avatar';
import { formatTime } from '@/shared/format/chat';
import type { ChatMessage } from '@localloop/shared-types';
import { QuotedReply } from './QuotedReply';
import { styles, layoutDimensions } from './styles';

interface PeerBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
  onPressAvatar?: () => void;
  /** See OwnBubble — neighbors enable the redesigned layout (run grouping,
   * always-visible timestamp on lastOfRun, avatar gated to lastOfRun). */
  previousMessage?: ChatMessage | null;
  nextMessage?: ChatMessage | null;
  replyTo?: { author: string; text: string };
  onPressReply?: () => void;
}

export function PeerBubble({
  message,
  showSenderName = true,
  onPressAvatar,
  previousMessage,
  nextMessage,
  replyTo,
  onPressReply,
}: PeerBubbleProps) {
  const enhanced =
    previousMessage !== undefined || nextMessage !== undefined;
  const firstOfRun =
    !previousMessage || previousMessage.senderId !== message.senderId;
  const lastOfRun = !nextMessage || nextMessage.senderId !== message.senderId;

  const [tapTimestampVisible, setTapTimestampVisible] = useState(false);
  const timestamp = formatTime(message.createdAt);

  const bubbleStyle = enhanced
    ? [
        styles.peerBubble,
        !firstOfRun && styles.peerBubbleMidTop,
        !lastOfRun && styles.peerBubbleMidBottom,
        lastOfRun && styles.peerBubbleTail,
        replyTo && styles.peerBubbleWithReply,
      ]
    : [styles.peerBubble, styles.peerBubbleTail];

  const showAvatarSlot = enhanced ? lastOfRun : true;
  const avatar = showAvatarSlot ? (
    <Avatar
      name={message.senderName}
      uri={message.senderAvatarUrl}
      size={layoutDimensions.peerAvatar}
    />
  ) : (
    <View
      style={{
        width: layoutDimensions.peerAvatar,
        height: layoutDimensions.peerAvatar,
      }}
    />
  );

  const handlePressBubble = () => {
    if (enhanced && lastOfRun) return;
    setTapTimestampVisible((v) => !v);
  };

  const renderFooter = () => {
    if (enhanced) {
      if (lastOfRun) {
        return (
          <Text
            style={styles.peerTimestamp}
            testID={`peer-timestamp-${message.id}`}
          >
            {timestamp}
          </Text>
        );
      }
      return tapTimestampVisible ? (
        <Text
          style={styles.peerTimestamp}
          testID={`peer-timestamp-${message.id}`}
        >
          {timestamp}
        </Text>
      ) : null;
    }
    return tapTimestampVisible ? (
      <Text
        style={styles.peerTimestamp}
        testID={`peer-timestamp-${message.id}`}
      >
        {timestamp}
      </Text>
    ) : null;
  };

  const showName = enhanced ? showSenderName && firstOfRun : showSenderName;

  return (
    <View
      style={[
        styles.peerRow,
        enhanced && firstOfRun && styles.peerRowFirstOfRun,
      ]}
      testID={`peer-row-${message.id}`}
    >
      {onPressAvatar && showAvatarSlot ? (
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
        {showName && (
          <View style={styles.peerNameRow}>
            <Text style={styles.peerName}>{message.senderName}</Text>
          </View>
        )}
        <Pressable
          onPress={handlePressBubble}
          accessibilityRole='button'
          accessibilityLabel={
            tapTimestampVisible
              ? 'Ocultar horário da mensagem'
              : 'Mostrar horário da mensagem'
          }
          testID={`peer-bubble-${message.id}`}
        >
          <View style={bubbleStyle}>
            {replyTo && (
              <QuotedReply
                originalAuthor={replyTo.author}
                originalText={replyTo.text}
                me={false}
                onPress={onPressReply}
              />
            )}
            <Text style={styles.peerBubbleText}>{message.content}</Text>
          </View>
        </Pressable>
        {renderFooter()}
      </View>
    </View>
  );
}
