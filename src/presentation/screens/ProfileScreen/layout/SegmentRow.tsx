import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Option<T> {
  id: T;
  label: string;
}

interface Props<T> {
  icon: IconName;
  title: string;
  options: Option<T>[];
  value: T;
  onChange: (next: T) => void;
}

export default function SegmentRow<T extends string | number | boolean>({
  icon,
  title,
  options,
  value,
  onChange,
}: Props<T>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.segmentRow}>
      <View style={[styles.rowIconBubble, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={14} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <View style={styles.segmentTrack}>
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={String(opt.id)}
              onPress={() => onChange(opt.id)}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              accessibilityRole='button'
              accessibilityLabel={`${title}: ${opt.label}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  active && styles.segmentLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
