import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Props {
  icon: IconName;
  title: string;
  value?: string;
  danger?: boolean;
  mono?: boolean;
  chevron?: boolean;
  onPress?: () => void;
}

export default function Row({
  icon,
  title,
  value,
  danger,
  mono,
  chevron = true,
  onPress,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const tint = danger ? colors.error : colors.primary;
  const bubbleBg = danger ? colors.dangerSoft : colors.primarySoft;

  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIconBubble, { backgroundColor: bubbleBg }]}>
        <Icon name={icon} size={14} color={tint} strokeWidth={2} />
      </View>
      <Text
        style={[styles.rowTitle, danger && { color: colors.error }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {value ? (
        <Text style={mono ? styles.rowValueMono : styles.rowValue}>{value}</Text>
      ) : null}
      {chevron && onPress ? (
        <Icon name='chevronRight' size={14} color={colors.faint} strokeWidth={2} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole='button' accessibilityLabel={title}>
      {content}
    </Pressable>
  );
}
