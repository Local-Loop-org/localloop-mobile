import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

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
  return (
    <View style={styles.segmentRow}>
      <View style={[styles.rowIconBubble, { backgroundColor: 'rgba(0,209,255,0.1)' }]}>
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
