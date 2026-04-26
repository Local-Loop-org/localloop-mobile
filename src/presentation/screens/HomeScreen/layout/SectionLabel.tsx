import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

interface Props {
  iconName: IconName;
  title: string;
  count: number;
  /** No-op until HOME-7 lands the GroupListByTypeScreen. */
  onPressSeeAll?: () => void;
}

export function SectionLabel({
  iconName,
  title,
  count,
  onPressSeeAll,
}: Props) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionIconBox}>
          <Icon name={iconName} size={12} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {onPressSeeAll ? (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onPressSeeAll}>
          <Text style={styles.seeAllText}>Ver todos →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
