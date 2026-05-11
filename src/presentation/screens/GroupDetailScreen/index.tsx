import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MemberRole } from '@localloop/shared-types';
import { type GroupDetail } from '@/infra/api/groups.api';
import { useGroupDetail } from '@/application/hooks/useGroupDetail';
import { useGroupJoinRequests } from '@/application/hooks/useGroupJoinRequests';
import { useGroupMembers } from '@/application/hooks/useGroupMembers';
import { useJoinGroup } from '@/application/hooks/useJoinGroup';
import { useLeaveGroup } from '@/application/hooks/useLeaveGroup';
import { useBanMember } from '@/application/hooks/useBanMember';
import { useDeleteGroup } from '@/application/hooks/useDeleteGroup';
import { useResolveJoinRequest } from '@/application/hooks/useResolveJoinRequest';
import { confirmDestructive } from '@/shared/ui/confirmDestructive';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import { StackRoutes, TabRoutes } from '@/presentation/navigation/routes';
import GroupDetailLayout from './layout';
import type { JoinButtonState } from './layout/types';

type Props = AuthenticatedStackScreenProps<'GroupDetail'>;

function deriveJoinButtonState(
  group: GroupDetail | undefined,
  localPending: boolean,
): JoinButtonState {
  if (!group) return 'join';
  if (localPending) return 'pending';
  return group.myRole === null ? 'join' : 'joined';
}

function isPrivileged(role: MemberRole | null | undefined): boolean {
  return role === MemberRole.OWNER || role === MemberRole.MODERATOR;
}

function navigateToHome(navigation: Props['navigation']) {
  navigation.navigate({
    name: StackRoutes.HomeTabs,
    params: { screen: TabRoutes.Home },
  });
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;

  const detailQuery = useGroupDetail(groupId);
  const group = detailQuery.data;
  const privileged = isPrivileged(group?.myRole);

  const requestsQuery = useGroupJoinRequests(groupId, { enabled: privileged });
  const { refetch: refetchRequests } = requestsQuery;
  const membersQuery = useGroupMembers(groupId, {
    limit: 5,
    enabled: !!group,
  });

  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();
  const deleteMutation = useDeleteGroup();
  const banMutation = useBanMember();
  const resolveMutation = useResolveJoinRequest();

  const [localPending, setLocalPending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (privileged) {
        void refetchRequests();
      }
    }, [privileged, refetchRequests]),
  );

  const handleJoin = async () => {
    if (!group) return;
    try {
      const result = await joinMutation.mutateAsync({ groupId, group });
      if (result.status === 'joined') {
        await detailQuery.refetch();
      } else {
        setLocalPending(true);
        Alert.alert(
          'Solicitação enviada',
          'Aguarde a aprovação de um moderador para entrar no grupo.',
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar no grupo. Tente novamente.');
    }
  };

  const handleResolveRequest = (
    requestId: string,
    action: 'approve' | 'reject',
  ) => {
    resolveMutation.mutate(
      { groupId, requestId, action },
      {
        onError: () =>
          Alert.alert(
            'Erro',
            action === 'approve'
              ? 'Não foi possível aprovar esta solicitação.'
              : 'Não foi possível rejeitar esta solicitação.',
          ),
      },
    );
  };

  const handleLeave = () => {
    confirmDestructive({
      title: 'Sair do grupo?',
      message: 'Você deixará de receber atualizações deste grupo.',
      confirmLabel: 'Sair',
      onConfirm: async () => {
        try {
          await leaveMutation.mutateAsync({ groupId });
          navigateToHome(navigation);
        } catch {
          Alert.alert(
            'Erro',
            'Não foi possível sair do grupo. Tente novamente.',
          );
        }
      },
    });
  };

  const handleDelete = () => {
    confirmDestructive({
      title: 'Excluir grupo?',
      message:
        'Esta ação não pode ser desfeita. Todas as conversas e membros serão removidos.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync({ groupId });
          navigateToHome(navigation);
        } catch {
          Alert.alert(
            'Erro',
            'Não foi possível excluir o grupo. Tente novamente.',
          );
        }
      },
    });
  };

  const handleBanMember = (userId: string) => {
    banMutation.mutate(
      { groupId, userId },
      {
        onError: () =>
          Alert.alert('Erro', 'Não foi possível banir este membro.'),
      },
    );
  };

  const handlePressMembers = () => {
    navigation.navigate(StackRoutes.GroupMembers, {
      groupId,
      myRole: group?.myRole ?? null,
    });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigateToHome(navigation);
    }
  };

  return (
    <GroupDetailLayout
      group={group ?? null}
      loading={detailQuery.isLoading}
      errorMessage={
        detailQuery.isError ? 'Não foi possível carregar o grupo.' : null
      }
      joinButtonState={deriveJoinButtonState(group, localPending)}
      isJoining={joinMutation.isPending}
      onJoin={handleJoin}
      onBack={handleBack}
      showModerationSection={privileged}
      pendingRequests={requestsQuery.data ?? []}
      resolvingRequestId={null}
      onApproveRequest={(id) => handleResolveRequest(id, 'approve')}
      onRejectRequest={(id) => handleResolveRequest(id, 'reject')}
      onPressMembers={handlePressMembers}
      members={membersQuery.data ?? []}
      isLeaving={leaveMutation.isPending}
      isDeleting={deleteMutation.isPending}
      onLeave={handleLeave}
      onPressDelete={handleDelete}
      onBanMember={handleBanMember}
    />
  );
}
