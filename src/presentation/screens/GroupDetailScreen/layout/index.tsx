import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GroupPrivacy } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { styles } from './styles';
import type { GroupDetailLayoutProps, JoinButtonState } from './types';

const JOIN_BUTTON_LABEL: Record<JoinButtonState, string> = {
  join: 'Entrar no grupo',
  pending: 'Solicitação pendente',
  joined: 'Você já faz parte',
};

const PRIVACY_LABEL: Record<GroupPrivacy, string> = {
  [GroupPrivacy.OPEN]: 'Aberto',
  [GroupPrivacy.APPROVAL_REQUIRED]: 'Requer aprovação',
};

export default function GroupDetailLayout({
  group,
  loading,
  errorMessage,
  joinButtonState,
  isJoining,
  onJoin,
  onBack,
  showModerationSection,
  pendingRequests,
  resolvingRequestId,
  onApproveRequest,
  onRejectRequest,
  showMembersButton,
  onPressMembers,
  showChatButton,
  onPressChat,
  showLeaveButton,
  isOwner,
  isLeaving,
  onLeave,
}: GroupDetailLayoutProps) {
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {errorMessage ?? 'Grupo não encontrado.'}
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const joinDisabled = joinButtonState !== 'join' || isJoining;
  const leaveDisabled = isOwner || isLeaving;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.anchor}>{group.anchorLabel}</Text>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Privacidade</Text>
            <Text style={styles.metaValue}>{PRIVACY_LABEL[group.privacy]}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Membros</Text>
            <Text style={styles.metaValue}>{group.memberCount}</Text>
          </View>
        </View>

        {group.description ? (
          <Text style={styles.description}>{group.description}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.joinBtn, joinDisabled && styles.joinBtnDisabled]}
          onPress={onJoin}
          disabled={joinDisabled}
        >
          {isJoining ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text
              style={[
                styles.joinBtnText,
                joinDisabled && styles.joinBtnTextDisabled,
              ]}
            >
              {JOIN_BUTTON_LABEL[joinButtonState]}
            </Text>
          )}
        </TouchableOpacity>

        {showChatButton ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onPressChat}
          >
            <Text style={styles.secondaryBtnText}>Chat do grupo</Text>
          </TouchableOpacity>
        ) : null}

        {showMembersButton ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onPressMembers}
          >
            <Text style={styles.secondaryBtnText}>Ver membros</Text>
          </TouchableOpacity>
        ) : null}

        {showModerationSection ? (
          <View style={styles.modSection}>
            <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyRequests}>Nenhuma solicitação no momento.</Text>
            ) : (
              pendingRequests.map((req) => {
                const isResolving = resolvingRequestId === req.id;
                return (
                  <View key={req.id} style={styles.requestRow}>
                    <Text style={styles.requestName}>{req.displayName}</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.approveBtn, isResolving && styles.btnDisabled]}
                        disabled={isResolving}
                        onPress={() => onApproveRequest(req.id)}
                      >
                        <Text style={styles.approveBtnText}>Aprovar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rejectBtn, isResolving && styles.btnDisabled]}
                        disabled={isResolving}
                        onPress={() => onRejectRequest(req.id)}
                      >
                        <Text style={styles.rejectBtnText}>Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {showLeaveButton ? (
          <>
            <TouchableOpacity
              style={[styles.leaveBtn, leaveDisabled && styles.leaveBtnDisabled]}
              disabled={leaveDisabled}
              onPress={onLeave}
            >
              {isLeaving ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={styles.leaveBtnText}>Sair do grupo</Text>
              )}
            </TouchableOpacity>
            {isOwner ? (
              <Text style={styles.leaveHelper}>
                Transfira a liderança antes de sair.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
