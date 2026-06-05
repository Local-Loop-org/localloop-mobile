import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fonts, type ThemeColors } from '@/shared/theme';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon } from '@/shared/icons';

interface HeaderBarProps {
  onBack: () => void;
  canEdit?: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export function HeaderBar({
  onBack,
  canEdit,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
}: HeaderBarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const renderRight = () => {
    if (!canEdit) {
      return <View style={styles.spacer} />;
    }
    if (isEditing) {
      if (isSaving) {
        return (
          <View style={styles.savingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      }
      return (
        <View style={styles.editActions}>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            testID="group-detail-cancel-edit"
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            testID="group-detail-save-edit"
          >
            <Text style={styles.saveText}>Salvar</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <Pressable
        onPress={onEdit}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Editar grupo"
        testID="group-detail-edit"
      >
        <Icon name="edit" size={15} color={colors.text} strokeWidth={2} />
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        testID="group-detail-back"
      >
        <Icon name="back" size={15} color={colors.text} strokeWidth={2} />
      </Pressable>
      <Text style={styles.title}>GRUPO</Text>
      {renderRight()}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
    letterSpacing: 1.6,
  },
  spacer: {
    width: 36,
    height: 36,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.dim,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  savingWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
