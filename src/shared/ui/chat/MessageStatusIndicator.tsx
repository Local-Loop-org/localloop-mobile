import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/shared/theme';
import { styles } from './styles';

export type OwnMessageStatus =
  | 'sending'
  | 'sent'
  | 'read'
  | 'pending'
  | null
  | undefined;

interface MessageStatusIndicatorProps {
  status: OwnMessageStatus;
  timestamp: string;
}

function SingleCheck({ color }: { color: string }) {
  return (
    <Svg width={14} height={10} viewBox='0 0 14 10' fill='none'>
      <Path
        d='M1 5l3.5 3.5L10 2'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

function DoubleCheck({ color }: { color: string }) {
  return (
    <Svg width={14} height={10} viewBox='0 0 14 10' fill='none'>
      <Path
        d='M1 5l3.5 3.5L9 2'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M5 5l3.5 3.5L13 2'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

function ClockGlyph({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox='0 0 12 12' fill='none'>
      <Circle cx={6} cy={6} r={4.6} stroke={color} strokeWidth={1.4} />
      <Path
        d='M6 3.5V6l1.6 1.2'
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

export function MessageStatusIndicator({
  status,
  timestamp,
}: MessageStatusIndicatorProps) {
  if (status === 'sending') {
    return (
      <View style={styles.statusRow} testID='own-status-sending'>
        <Text style={styles.statusTimestamp}>enviando</Text>
        <ActivityIndicator size='small' color={colors.faint} />
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={styles.statusRow} testID='own-status-pending'>
        <Text style={styles.statusTimestamp}>{timestamp}</Text>
        <View style={styles.statusPendingGroup}>
          <ClockGlyph color={colors.accent2} />
          <Text style={styles.statusPendingText}>pendente</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusTimestamp}>{timestamp}</Text>
      {status === 'sent' && <SingleCheck color={colors.faint} />}
      {status === 'read' && <DoubleCheck color={colors.primary} />}
    </View>
  );
}
