import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme';
import { ReplyGlyph } from './ReplyGlyph';
import { styles } from './styles';

interface QuotedReplyProps {
  originalAuthor: string;
  originalText: string;
  me: boolean;
  onPress?: () => void;
}

export function QuotedReply({
  originalAuthor,
  originalText,
  me,
  onPress,
}: QuotedReplyProps) {
  const railColor = me ? 'rgba(255,255,255,0.85)' : colors.primary;
  const labelColor = me ? 'rgba(255,255,255,0.92)' : colors.primary;
  const textColor = me ? 'rgba(255,255,255,0.8)' : colors.dim;
  const blockStyle = [
    styles.quotedBlock,
    me ? styles.quotedBlockMe : styles.quotedBlockPeer,
  ];

  return (
    <Pressable
      onPress={onPress}
      style={blockStyle}
      accessibilityRole='button'
      accessibilityLabel={`Resposta a ${originalAuthor}: ${originalText}`}
    >
      <View style={[styles.quotedRail, { backgroundColor: railColor }]} />
      <View style={styles.quotedBody}>
        <View style={styles.quotedAuthorRow}>
          <ReplyGlyph size={9} color={labelColor} strokeWidth={2} />
          <Text
            style={[styles.quotedAuthor, { color: labelColor }]}
            numberOfLines={1}
          >
            {originalAuthor.toUpperCase()}
          </Text>
        </View>
        <Text
          style={[styles.quotedText, { color: textColor }]}
          numberOfLines={1}
        >
          {originalText}
        </Text>
      </View>
    </Pressable>
  );
}
