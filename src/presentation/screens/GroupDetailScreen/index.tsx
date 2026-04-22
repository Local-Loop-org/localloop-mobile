import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import {
  groupsApi,
  type GroupDetail,
} from '@/infra/api/groups.api';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import GroupDetailLayout from './layout';
import type { JoinButtonState } from './layout/types';

type Props = AuthenticatedStackScreenProps<'GroupDetail'>;

/** Map `myRole` (plus a local pending flag) to the button state the layout renders. */
function deriveJoinButtonState(
  group: GroupDetail | null,
  localPending: boolean,
): JoinButtonState {
  if (!group) return 'join';
  if (localPending) return 'pending';
  switch (group.myRole) {
    case null:
      return 'join';
    case MemberRole.OWNER:
    case MemberRole.MODERATOR:
    case MemberRole.MEMBER:
      return 'joined';
  }
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [localPending, setLocalPending] = useState(false);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const detail = await groupsApi.getGroupDetail(groupId);
      setGroup(detail);
    } catch {
      setErrorMessage('Não foi possível carregar o grupo.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await groupsApi.joinGroup(groupId);
      if (result.status === 'joined') {
        // Refresh detail so memberCount and myRole reflect the join.
        await loadGroup();
      } else {
        setLocalPending(true);
        Alert.alert(
          'Solicitação enviada',
          'Aguarde a aprovação de um moderador para entrar no grupo.',
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar no grupo. Tente novamente.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <GroupDetailLayout
      group={group}
      loading={loading}
      errorMessage={errorMessage}
      joinButtonState={deriveJoinButtonState(group, localPending)}
      isJoining={isJoining}
      onJoin={handleJoin}
      onBack={() => navigation.goBack()}
    />
  );
}
