import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MemberRole } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { styles } from './styles';
import type { GroupMembersLayoutProps } from './types';
import type { GroupMember } from '@/infra/api/groups.api';

const ROLE_LABEL: Record<MemberRole, string> = {
  [MemberRole.OWNER]: 'Líder',
  [MemberRole.MODERATOR]: 'Moderador',
  [MemberRole.MEMBER]: 'Membro',
};

function MemberRow({
  member,
  canBan,
  isBanning,
  onBan,
}: {
  member: GroupMember;
  canBan: boolean;
  isBanning: boolean;
  onBan: (target: GroupMember) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>{member.displayName}</Text>
        <Text style={styles.role}>{ROLE_LABEL[member.role]}</Text>
      </View>
      {canBan ? (
        <TouchableOpacity
          style={[styles.banBtn, isBanning && styles.banBtnDisabled]}
          disabled={isBanning}
          onPress={() => onBan(member)}
        >
          <Text style={styles.banBtnText}>Banir</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function GroupMembersLayout({
  members,
  loading,
  errorMessage,
  banningUserId,
  canBan,
  onBan,
  onBack,
}: GroupMembersLayoutProps) {
  const showInitialLoader = loading && members.length === 0 && !errorMessage;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Membros</Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {showInitialLoader ? (
        <View style={styles.emptyWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              canBan={canBan(item)}
              isBanning={banningUserId === item.userId}
              onBan={onBan}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyTitle}>Nenhum membro ativo.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
