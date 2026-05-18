import React, { useState } from 'react';
import { Alert } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { useGroupMembers } from '@/application/hooks/useGroupMembers/useGroupMembers';
import { useGroupJoinRequests } from '@/application/hooks/useGroupJoinRequests/useGroupJoinRequests';
import { useBanMember } from '@/application/hooks/useBanMember/useBanMember';
import { useUnbanMember } from '@/application/hooks/useUnbanMember/useUnbanMember';
import { usePromoteMember } from '@/application/hooks/usePromoteMember/usePromoteMember';
import { useDemoteMember } from '@/application/hooks/useDemoteMember/useDemoteMember';
import { useBannedMembers } from '@/application/hooks/useBannedMembers/useBannedMembers';
import { useResolveJoinRequest } from '@/application/hooks/useResolveJoinRequest/useResolveJoinRequest';
import { useGroupDetail } from '@/application/hooks/useGroupDetail/useGroupDetail';
import { useAuthStore } from '@/application/stores/auth.store';
import { confirmDestructive } from '@/shared/ui/confirmDestructive';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import { StackRoutes } from '@/presentation/navigation/routes';
import type { GroupMember } from '@/infra/api/groups.api';
import GroupMembersLayout from './layout';
import type { FilterChipKey } from './layout/types';

type Props = AuthenticatedStackScreenProps<'GroupMembers'>;

const MEMBERS_PAGE_SIZE = 50;

export default function GroupMembersScreen({ navigation, route }: Props) {
  const { groupId, myRole } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const canManage =
    myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR;

  const groupDetailQuery = useGroupDetail(groupId);
  const groupName = groupDetailQuery.data?.name ?? null;

  const membersQuery = useGroupMembers(groupId, { limit: MEMBERS_PAGE_SIZE });
  const requestsQuery = useGroupJoinRequests(groupId, { enabled: canManage });
  const bannedQuery = useBannedMembers(groupId, { enabled: canManage });

  const banMember = useBanMember();
  const unbanMember = useUnbanMember();
  const promoteMember = usePromoteMember();
  const demoteMember = useDemoteMember();
  const resolveRequest = useResolveJoinRequest();

  const [filter, setFilter] = useState<FilterChipKey>('all');
  const [query, setQuery] = useState('');

  const errorMessage =
    membersQuery.isError
      ? 'Não foi possível carregar os membros.'
      : null;

  const handleBan = (userId: string) => {
    const target = membersQuery.data?.find((m) => m.userId === userId);
    if (!target) return;
    confirmDestructive({
      title: 'Banir membro?',
      message: `${target.displayName} será removido do grupo e não poderá entrar novamente até ser desbanido.`,
      confirmLabel: 'Banir',
      onConfirm: () =>
        banMember.mutateAsync({ groupId, userId }).catch(() => {
          Alert.alert(
            'Erro',
            'Não foi possível banir este membro. Tente novamente.',
          );
        }),
    });
  };

  const handleUnban = (userId: string) => {
    confirmDestructive({
      title: 'Desbanir membro?',
      message: 'Esta pessoa poderá entrar no grupo novamente.',
      confirmLabel: 'Desbanir',
      cancelLabel: 'Cancelar',
      onConfirm: () =>
        unbanMember.mutateAsync({ groupId, userId }).catch(() => {
          Alert.alert(
            'Erro',
            'Não foi possível desbanir este membro. Tente novamente.',
          );
        }),
    });
  };

  const handlePromote = (userId: string) => {
    const target = membersQuery.data?.find((m) => m.userId === userId);
    if (!target) return;
    confirmDestructive({
      title: 'Promover a admin?',
      message: `${target.displayName} poderá moderar membros e aprovar solicitações.`,
      confirmLabel: 'Promover',
      cancelLabel: 'Cancelar',
      onConfirm: () =>
        promoteMember.mutateAsync({ groupId, userId }).catch(() => {
          Alert.alert(
            'Erro',
            'Não foi possível promover este membro. Tente novamente.',
          );
        }),
    });
  };

  const handleDemote = (userId: string) => {
    const target = membersQuery.data?.find((m) => m.userId === userId);
    if (!target) return;
    confirmDestructive({
      title: 'Rebaixar admin?',
      message: `${target.displayName} voltará a ser um membro comum.`,
      confirmLabel: 'Rebaixar',
      cancelLabel: 'Cancelar',
      onConfirm: () =>
        demoteMember.mutateAsync({ groupId, userId }).catch(() => {
          Alert.alert(
            'Erro',
            'Não foi possível rebaixar este admin. Tente novamente.',
          );
        }),
    });
  };

  const handleApprove = (requestId: string) => {
    resolveRequest.mutate({ groupId, requestId, action: 'approve' });
  };

  const handleReject = (requestId: string) => {
    resolveRequest.mutate({ groupId, requestId, action: 'reject' });
  };

  const handlePressMember = (member: GroupMember) => {
    if (member.userId === currentUserId) return;
    navigation.navigate(StackRoutes.DmChat, {
      peerId: member.userId,
      peerName: member.displayName,
      peerAvatarUrl: member.avatarUrl,
    });
  };

  return (
    <GroupMembersLayout
      groupName={groupName}
      myRole={myRole}
      canManage={canManage}
      currentUserId={currentUserId}
      activeMembers={membersQuery.data ?? []}
      pendingRequests={requestsQuery.data ?? []}
      bannedMembers={bannedQuery.data ?? []}
      loadingActive={membersQuery.isLoading}
      loadingPending={requestsQuery.isLoading}
      loadingBanned={canManage && bannedQuery.isLoading}
      errorMessage={errorMessage}
      query={query}
      onQueryChange={setQuery}
      filter={filter}
      onFilterChange={setFilter}
      banningUserId={
        banMember.isPending ? (banMember.variables?.userId ?? null) : null
      }
      unbanningUserId={
        unbanMember.isPending ? (unbanMember.variables?.userId ?? null) : null
      }
      resolvingRequestId={
        resolveRequest.isPending
          ? (resolveRequest.variables?.requestId ?? null)
          : null
      }
      onPressMember={handlePressMember}
      onBan={handleBan}
      onUnban={handleUnban}
      onPromote={handlePromote}
      onDemote={handleDemote}
      onApprove={handleApprove}
      onReject={handleReject}
      onBack={() => navigation.goBack()}
    />
  );
}
