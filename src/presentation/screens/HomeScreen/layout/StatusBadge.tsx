import React from 'react';
import { View, Text } from 'react-native';
import { MemberStatus, GroupPrivacy } from '@localloop/shared-types';
import type { NearbyGroup } from '@/infra/api/groups.api';
import { styles } from './styles';

interface Props {
  group: NearbyGroup;
}

export function StatusBadge({ group }: Props) {
  if (group.memberStatus === MemberStatus.ACTIVE)
    return (
      <View style={styles.cardMemberBtn}>
        <Text style={styles.cardMemberText}>Conversar</Text>
      </View>
    );
  if (group.memberStatus === MemberStatus.PENDING)
    return (
      <View style={styles.cardPendingBtn}>
        <Text style={styles.cardPendingText}>Aguardando</Text>
      </View>
    );
  if (group.privacy === GroupPrivacy.APPROVAL_REQUIRED)
    return (
      <View style={styles.cardRequestBtn}>
        <Text style={styles.cardRequestText}>Solicitar</Text>
      </View>
    );
  return (
    <View style={styles.cardJoinBtn}>
      <Text style={styles.cardJoinText}>Entrar</Text>
    </View>
  );
}
