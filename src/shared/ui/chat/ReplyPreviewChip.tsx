import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { ReplyGlyph } from './ReplyGlyph';
import { createStyles } from './styles';

interface ReplyPreviewChipProps {
  authorLabel: string;
  originalText: string;
  onCancel: () => void;
}

export function ReplyPreviewChip({
  authorLabel,
  originalText,
  onCancel,
}: ReplyPreviewChipProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.replyChip} testID='reply-preview-chip'>
      <LinearGradient
        colors={[colors.primary, colors.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.replyChipRail}
      />
      <View style={styles.replyChipBody}>
        <View style={styles.replyChipHeaderRow}>
          <ReplyGlyph size={10} color={colors.primary} strokeWidth={2} />
          <Text style={styles.replyChipHeader} numberOfLines={1}>
            RESPONDENDO A {authorLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.replyChipBodyText} numberOfLines={1}>
          {originalText}
        </Text>
      </View>
      <Pressable
        onPress={onCancel}
        style={styles.replyChipCancel}
        hitSlop={8}
        accessibilityRole='button'
        accessibilityLabel='Cancelar resposta'
        testID='reply-preview-cancel'
      >
        <Icon name='x' size={12} color={colors.dim} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
