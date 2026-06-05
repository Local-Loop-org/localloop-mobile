import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface DmRequestComposerProps {
  peerFirstName: string;
  onCancel: () => void;
}

function ClockGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox='0 0 12 12' fill='none'>
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

export function DmRequestComposer({
  peerFirstName,
  onCancel,
}: DmRequestComposerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.requestComposer} testID='dm-request-composer'>
      <View style={styles.requestComposerInner}>
        <ClockGlyph color={colors.dim} />
        <View style={styles.requestComposerText}>
          <Text style={styles.requestComposerTitle} numberOfLines={1}>
            Aguardando {peerFirstName} aprovar
          </Text>
          <Text style={styles.requestComposerSub} numberOfLines={1}>
            NOVO ENVIO BLOQUEADO ATÉ APROVAÇÃO
          </Text>
        </View>
        <Pressable
          onPress={onCancel}
          style={styles.requestComposerCancel}
          accessibilityRole='button'
          accessibilityLabel='Cancelar solicitação'
          testID='dm-request-cancel'
        >
          <Text style={styles.requestComposerCancelText}>CANCELAR</Text>
        </Pressable>
      </View>
    </View>
  );
}
