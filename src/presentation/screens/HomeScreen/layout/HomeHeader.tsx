import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  onPressSearch: () => void;
  onPressMore: () => void;
}

export function HomeHeader({ onPressSearch, onPressMore }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>LocalLoop</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          accessibilityLabel="Buscar"
          style={styles.iconBtn}
          onPress={onPressSearch}
        >
          <Icon name="search" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Mais opções"
          style={styles.iconBtn}
          onPress={onPressMore}
        >
          <Icon name="more" size={17} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
