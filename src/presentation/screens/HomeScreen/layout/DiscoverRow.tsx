import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/shared/icons';
import { anchorIconName } from '@/shared/icons/anchorIcon';
import { colors } from '@/shared/theme';
import { formatDistance } from '@/shared/format/distance';
import type { NearbyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

interface Props {
  group: NearbyGroup;
  onPress: (id: string) => void;
}

export function DiscoverRow({ group, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(group.id)}
      accessibilityRole='button'
      accessibilityLabel={`Abrir ${group.name}`}
    >
      <View style={styles.rowIconBox}>
        <Icon
          name={anchorIconName(group.anchorType)}
          size={18}
          color={colors.primary}
          strokeWidth={1.9}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatDistance(group.distanceMeters)} · {group.memberCount} MEM
        </Text>
      </View>
      <View style={styles.cardJoinBtn}>
        <Text style={styles.cardJoinText}>Entrar</Text>
      </View>
    </TouchableOpacity>
  );
}
