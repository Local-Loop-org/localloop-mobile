import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/shared/theme';
import { styles } from './styles';
import type { GroupDiscoveryLayoutProps } from './types';
import type { NearbyGroup } from '@/infra/api/groups.api';

function GroupCard({
  group,
  onPress,
}: {
  group: NearbyGroup;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(group.id)}>
      <Text style={styles.cardName}>{group.name}</Text>
      <Text style={styles.cardAnchor}>{group.anchorLabel}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.proximity}>{group.proximityLabel}</Text>
        <Text style={styles.memberCount}>
          {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GroupDiscoveryLayout({
  groups,
  loading,
  refreshing,
  errorMessage,
  onRefresh,
  onPressGroup,
  onPressCreate,
  onLogout,
}: GroupDiscoveryLayoutProps) {
  const showInitialLoader = loading && groups.length === 0 && !errorMessage;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grupos próximos</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {showInitialLoader ? (
        <View style={styles.emptyWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={onPressGroup} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyTitle}>Nenhum grupo por aqui ainda</Text>
              <Text style={styles.emptySubtitle}>
                Seja o primeiro a criar um grupo na sua região.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onPressCreate}>
        <Text style={styles.fabText}>+ Novo grupo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
