import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/shared/theme';

interface FailedMessageWarningProps {
  size?: number;
  onPress: () => void;
}

export function FailedMessageWarning({
  size = 16,
  onPress,
}: FailedMessageWarningProps) {
  const padding = 4;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole='button'
      accessibilityLabel='Mensagem não enviada — tocar para tentar de novo'
      testID='own-failed-warning'
      style={{
        width: size + padding * 2,
        height: size + padding * 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
        <Circle cx={8} cy={8} r={7} fill={colors.error} />
        <Rect x={7.15} y={3.6} width={1.7} height={5.2} rx={0.85} fill='#fff' />
        <Circle cx={8} cy={11.4} r={1} fill='#fff' />
      </Svg>
    </Pressable>
  );
}
