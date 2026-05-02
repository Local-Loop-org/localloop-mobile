import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  icon: IconName;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

export default function ToggleRow({ icon, title, sub, value, onChange }: Props) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.rowIconBubble, { backgroundColor: 'rgba(0,209,255,0.1)' }]}>
        <Icon name={icon} size={14} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#262630', true: colors.success }}
        thumbColor={colors.white}
        accessibilityLabel={title}
      />
    </View>
  );
}
