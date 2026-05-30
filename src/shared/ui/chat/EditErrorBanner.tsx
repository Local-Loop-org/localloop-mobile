import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface EditErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function EditErrorBanner({ message, onDismiss }: EditErrorBannerProps) {
  return (
    <View style={styles.editErrorBanner} testID='edit-error-banner'>
      <Text style={styles.editErrorBannerText} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        onPress={onDismiss}
        style={styles.editErrorBannerDismiss}
        hitSlop={8}
        accessibilityRole='button'
        accessibilityLabel='Dispensar erro'
        testID='edit-error-dismiss'
      >
        <Icon name='x' size={12} color={colors.error} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
