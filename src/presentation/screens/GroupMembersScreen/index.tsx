import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import {
  groupsApi,
  type GroupMember as GroupMemberData,
} from '@/infra/api/groups.api';
import type { AuthenticatedStackScreenProps } from '@/presentation/navigation/types';
import GroupMembersLayout from './layout';

type Props = AuthenticatedStackScreenProps<'GroupMembers'>;

function canBanTarget(
  callerRole: MemberRole | null,
  target: GroupMemberData,
): boolean {
  if (target.role === MemberRole.OWNER) return false;
  if (callerRole === MemberRole.OWNER) return true;
  if (callerRole === MemberRole.MODERATOR) {
    return target.role === MemberRole.MEMBER;
  }
  return false;
}

export default function GroupMembersScreen({ navigation, route }: Props) {
  const { groupId, myRole } = route.params;

  const [members, setMembers] = useState<GroupMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await groupsApi.listMembers(groupId);
      // TODO: paginate — use response.next_cursor to fetch subsequent pages.
      setMembers(response.data);
    } catch {
      setErrorMessage('Não foi possível carregar os membros.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleBan = (target: GroupMemberData) => {
    Alert.alert(
      'Banir membro?',
      `${target.displayName} será removido do grupo e não poderá entrar novamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Banir',
          style: 'destructive',
          onPress: async () => {
            setBanningUserId(target.userId);
            const previous = members;
            setMembers((list) =>
              list.filter((m) => m.userId !== target.userId),
            );
            try {
              await groupsApi.banMember(groupId, target.userId);
            } catch {
              setMembers(previous);
              Alert.alert(
                'Erro',
                'Não foi possível banir este membro. Tente novamente.',
              );
            } finally {
              setBanningUserId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <GroupMembersLayout
      members={members}
      loading={loading}
      errorMessage={errorMessage}
      banningUserId={banningUserId}
      canBan={(target) => canBanTarget(myRole, target)}
      onBan={handleBan}
      onBack={() => navigation.goBack()}
    />
  );
}
