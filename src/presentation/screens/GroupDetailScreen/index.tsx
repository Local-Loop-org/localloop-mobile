import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MemberRole } from '@localloop/shared-types';
import {
  groupsApi,
  type GroupDetail,
  type JoinRequest,
} from '@/infra/api/groups.api';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import GroupDetailLayout from './layout';
import type { JoinButtonState } from './layout/types';

type Props = AuthenticatedStackScreenProps<'GroupDetail'>;

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

function isPrivileged(role: MemberRole | null): boolean {
  return role === MemberRole.OWNER || role === MemberRole.MODERATOR;
}

function isActiveMember(role: MemberRole | null): boolean {
  return (
    role === MemberRole.OWNER ||
    role === MemberRole.MODERATOR ||
    role === MemberRole.MEMBER
  );
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [localPending, setLocalPending] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(
    null,
  );
  const [isLeaving, setIsLeaving] = useState(false);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const detail = await groupsApi.getGroupDetail(groupId);
      setGroup(detail);
      return detail;
    } catch {
      setErrorMessage('Não foi possível carregar o grupo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const loadPendingRequests = useCallback(async () => {
    try {
      const requests = await groupsApi.listJoinRequests(groupId);
      setPendingRequests(requests);
    } catch {
      // Non-fatal: pending requests section will stay empty.
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      if (group && isPrivileged(group.myRole)) {
        loadPendingRequests();
      }
    }, [group, loadPendingRequests]),
  );

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await groupsApi.joinGroup(groupId);
      if (result.status === 'joined') {
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

  const handleResolveRequest = async (
    requestId: string,
    action: 'approve' | 'reject',
  ) => {
    setResolvingRequestId(requestId);
    const previous = pendingRequests;
    setPendingRequests((list) => list.filter((r) => r.id !== requestId));
    try {
      await groupsApi.resolveJoinRequest(groupId, requestId, action);
      if (action === 'approve' && group) {
        setGroup({ ...group, memberCount: group.memberCount + 1 });
      }
    } catch {
      setPendingRequests(previous);
      Alert.alert(
        'Erro',
        action === 'approve'
          ? 'Não foi possível aprovar esta solicitação.'
          : 'Não foi possível rejeitar esta solicitação.',
      );
    } finally {
      setResolvingRequestId(null);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Sair do grupo?',
      'Você deixará de receber atualizações deste grupo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await groupsApi.leaveGroup(groupId);
              navigation.goBack();
            } catch {
              Alert.alert(
                'Erro',
                'Não foi possível sair do grupo. Tente novamente.',
              );
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ],
    );
  };

  const handlePressMembers = () => {
    navigation.navigate('GroupMembers', {
      groupId,
      myRole: group?.myRole ?? null,
    });
  };

  const handlePressChat = () => {
    navigation.navigate('GroupChat', { groupId });
  };

  const myRole = group?.myRole ?? null;

  return (
    <GroupDetailLayout
      group={group}
      loading={loading}
      errorMessage={errorMessage}
      joinButtonState={deriveJoinButtonState(group, localPending)}
      isJoining={isJoining}
      onJoin={handleJoin}
      onBack={() => navigation.goBack()}
      showModerationSection={isPrivileged(myRole)}
      pendingRequests={pendingRequests}
      resolvingRequestId={resolvingRequestId}
      onApproveRequest={(id) => handleResolveRequest(id, 'approve')}
      onRejectRequest={(id) => handleResolveRequest(id, 'reject')}
      showMembersButton={isActiveMember(myRole)}
      onPressMembers={handlePressMembers}
      showChatButton={isActiveMember(myRole)}
      onPressChat={handlePressChat}
      showLeaveButton={isActiveMember(myRole)}
      isOwner={myRole === MemberRole.OWNER}
      isLeaving={isLeaving}
      onLeave={handleLeave}
    />
  );
}
