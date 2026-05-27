import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface DmRequestBannerProps {
  peerFirstName: string;
}

function ClockTile({ color }: { color: string }) {
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

export function DmRequestBanner({ peerFirstName }: DmRequestBannerProps) {
  return (
    <View style={styles.requestBanner} testID='dm-request-banner'>
      <View style={styles.requestBannerIconTile}>
        <ClockTile color={colors.accent2} />
      </View>
      <View style={styles.requestBannerBody}>
        <Text style={styles.requestBannerTitle}>Enviado como solicitação</Text>
        <Text style={styles.requestBannerText}>
          {peerFirstName} só recebe mensagens diretas após aprovar. Você pode
          enviar <Text style={styles.requestBannerTextStrong}>1 mensagem</Text>{' '}
          enquanto aguarda — o resto desbloqueia quando ela aceitar.
        </Text>
      </View>
    </View>
  );
}
