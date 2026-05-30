import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface EditPreviewChipProps {
  onCancel: () => void;
}

export function EditPreviewChip({ onCancel }: EditPreviewChipProps) {
  return (
    <View style={styles.editChip} testID='edit-preview-chip'>
      <Icon name='edit' size={12} color={colors.primary} strokeWidth={2} />
      <Text style={styles.editChipText}>EDITANDO MENSAGEM</Text>
      <Pressable
        onPress={onCancel}
        style={styles.editChipCancel}
        hitSlop={8}
        accessibilityRole='button'
        accessibilityLabel='Cancelar edição'
        testID='edit-preview-cancel'
      >
        <Icon name='x' size={12} color={colors.dim} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
