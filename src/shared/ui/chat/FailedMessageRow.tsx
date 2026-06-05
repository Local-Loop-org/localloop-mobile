import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface FailedMessageRowProps {
  onRetry: () => void;
}

export function FailedMessageRow({ onRetry }: FailedMessageRowProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.statusRow} testID='own-status-failed'>
      <Text style={styles.statusErrorText}>Não enviada</Text>
      <Text style={styles.statusErrorDivider}>·</Text>
      <Pressable
        onPress={onRetry}
        hitSlop={8}
        accessibilityRole='button'
        accessibilityLabel='Tentar enviar mensagem de novo'
        testID='own-retry-link'
      >
        <Text style={styles.statusErrorRetry}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}
