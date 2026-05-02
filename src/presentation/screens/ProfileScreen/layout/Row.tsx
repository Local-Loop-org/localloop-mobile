import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

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
  const tint = danger ? colors.error : colors.primary;
  const bubbleBg = danger ? 'rgba(255,75,75,0.12)' : 'rgba(0,209,255,0.1)';

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
