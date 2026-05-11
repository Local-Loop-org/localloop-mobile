import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme';
import { MEMBER_ROLE_LABEL } from '@/shared/labels/memberRole';
import { styles } from './styles';
import type { GroupMembersLayoutProps } from './types';
import type { GroupMember } from '@/infra/api/groups.api';

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
        <Text style={styles.role}>{MEMBER_ROLE_LABEL[member.role]}</Text>
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
