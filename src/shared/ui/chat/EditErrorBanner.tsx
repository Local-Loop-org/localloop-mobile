import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface EditErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function EditErrorBanner({ message, onDismiss }: EditErrorBannerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
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
