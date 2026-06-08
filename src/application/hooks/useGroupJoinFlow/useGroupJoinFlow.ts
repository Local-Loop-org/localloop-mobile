import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
  MemberStatus,
  type NearbyGroup,
} from '@localloop/shared-types';
import { useJoinGroup } from '@/application/hooks/useJoinGroup/useJoinGroup';

/**
 * Minimal navigator the join flow needs. Declared locally (rather than imported
 * from `presentation/navigation`) so this application-layer hook stays free of
 * a presentation dependency; both HomeScreen's and MapScreen's `navigation`
 * props structurally satisfy it.
 */
export interface GroupChatNavigator {
  navigate(
    screen: 'GroupChat',
    params: {
      groupId: string;
      groupName: string;
      anchorType: AnchorType;
      myRole: MemberRole | null;
    },
  ): void;
}

interface UseGroupJoinFlowParams {
  groups: NearbyGroup[];
  navigation: GroupChatNavigator;
}

interface UseGroupJoinFlowResult {
  /** `groups` with an optimistic PENDING overlay for in-flight join requests. */
  effectiveGroups: NearbyGroup[];
  /** Tap handler for a discovery group: navigates, joins, or prompts to request. */
  handlePressGroup: (id: string) => void;
}

/**
 * Shared discovery group tap → join/navigate flow used by Home and Map.
 *
 * - ACTIVE member → open the chat.
 * - PENDING request → no-op (the row reads "Aguardando").
 * - mutation in flight → debounced (ignore extra taps).
 * - OPEN group → join optimistically and navigate straight into the chat.
 * - APPROVAL_REQUIRED group → confirm, then send a join request (optimistic
 *   PENDING overlay, rolled back on failure).
 */
export function useGroupJoinFlow({
  groups,
  navigation,
}: UseGroupJoinFlowParams): UseGroupJoinFlowResult {
  const [optimisticPending, setOptimisticPending] = useState<Set<string>>(
    new Set(),
  );
  const joinMutation = useJoinGroup();

  const effectiveGroups = useMemo(
    () =>
      groups.map((g) =>
        optimisticPending.has(g.id)
          ? { ...g, memberStatus: MemberStatus.PENDING }
          : g,
      ),
    [groups, optimisticPending],
  );

  const navigateToChat = useCallback(
    (
      id: string,
      groupName: string,
      anchorType: NearbyGroup['anchorType'],
      myRole: NearbyGroup['myRole'],
    ) => {
      navigation.navigate('GroupChat', {
        groupId: id,
        groupName,
        anchorType,
        myRole,
      });
    },
    [navigation],
  );

  const promptJoinRequest = useCallback(
    (id: string, group: NearbyGroup) => {
      Alert.alert(
        'Solicitar entrada?',
        `${group.name} requer aprovação de um moderador para participar. Deseja enviar uma solicitação?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Solicitar',
            onPress: async () => {
              setOptimisticPending((prev) => new Set([...prev, id]));
              try {
                await joinMutation.mutateAsync({ groupId: id, group });
                Alert.alert(
                  'Solicitação enviada',
                  'Aguarde a aprovação de um moderador para entrar no grupo.',
                );
              } catch {
                setOptimisticPending((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
                Alert.alert(
                  'Erro',
                  'Não foi possível enviar sua solicitação. Tente novamente.',
                );
              }
            },
          },
        ],
      );
    },
    [joinMutation],
  );

  const handlePressGroup = useCallback(
    (id: string) => {
      const group = effectiveGroups.find((g) => g.id === id);
      if (!group) return;

      if (group.memberStatus === MemberStatus.PENDING) return;

      if (joinMutation.isPending) return;

      if (group.memberStatus === MemberStatus.ACTIVE) {
        navigateToChat(id, group.name, group.anchorType, group.myRole);
        return;
      }

      if (group.privacy === GroupPrivacy.OPEN) {
        joinMutation.mutate({ groupId: id, group });
        navigateToChat(id, group.name, group.anchorType, MemberRole.MEMBER);
        return;
      }

      promptJoinRequest(id, group);
    },
    [effectiveGroups, joinMutation, navigateToChat, promptJoinRequest],
  );

  return { effectiveGroups, handlePressGroup };
}
