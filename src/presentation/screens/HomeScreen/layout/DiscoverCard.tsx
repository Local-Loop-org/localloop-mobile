import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/shared/icons';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import { colors } from '@/shared/theme';
import type { NearbyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

interface Props {
  group: NearbyGroup;
  onPress: (id: string) => void;
}

export function DiscoverCard({ group, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(group.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <Icon
            name={anchorIconName(group.anchorType)}
            size={17}
            color={colors.primary}
            strokeWidth={1.9}
          />
        </View>
      </View>
      <Text style={styles.cardName} numberOfLines={1}>
        {group.name}
      </Text>
      <Text style={styles.cardAnchor} numberOfLines={1}>
        {group.anchorLabel}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {group.proximityLabel.toUpperCase()} · {group.memberCount} MEM
        </Text>
        <View style={styles.cardJoinBtn}>
          <Text style={styles.cardJoinText}>Entrar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
