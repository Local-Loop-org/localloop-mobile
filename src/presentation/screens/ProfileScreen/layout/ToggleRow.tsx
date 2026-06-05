import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Props {
  icon: IconName;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

export default function ToggleRow({ icon, title, sub, value, onChange }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.rowIconBubble, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={14} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.switchTrackOff, true: colors.success }}
        thumbColor={colors.white}
        accessibilityLabel={title}
      />
    </View>
  );
}
