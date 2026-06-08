import React from 'react';
import { Text, View } from 'react-native';
import {
  GroupPrivacy,
  MemberStatus,
  type NearbyGroup,
} from '@localloop/shared-types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles } from './styles';

interface Props {
  group: Pick<NearbyGroup, 'memberStatus' | 'privacy'>;
}

/** Membership/privacy-aware action label for a nearby group row. */
export function GroupStatusBadge({ group }: Props) {
  const styles = useThemedStyles(createStyles);

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
