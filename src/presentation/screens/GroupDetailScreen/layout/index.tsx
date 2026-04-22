import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
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
      </ScrollView>
    </SafeAreaView>
  );
}
