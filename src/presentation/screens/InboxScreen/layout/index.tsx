import React from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { FilterChip } from '@/shared/ui/FilterChip';
import { SearchInput } from '@/shared/ui/SearchInput';
import { DmRow } from './DmRow';
import { RequestRow } from './RequestRow';
import { styles } from './styles';
import type { InboxLayoutProps } from './types';

export default function InboxLayout({
  totalActive,
  unreadTotal,
  activeFilter,
  searchQuery,
  chips,
  conversations,
  requests,
  emptyLabel,
  onChangeSearch,
  onChangeFilter,
  onOpenDm,
  onAcceptRequest,
  onIgnoreRequest,
  onPressEdit,
}: InboxLayoutProps) {
  const showingRequests = activeFilter === 'requests';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSubtitle}>
            {`${totalActive} CONVERSAS`}
            {unreadTotal > 0 ? (
              <Text style={styles.headerSubtitleAccent}>
                {` · ${unreadTotal} NÃO LIDAS`}
              </Text>
            ) : null}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onPressEdit}
            accessibilityRole="button"
            accessibilityLabel="Nova mensagem"
            style={styles.iconBtn}
            testID="inbox-edit-btn"
          >
            <Icon name="edit" size={16} color={colors.dim} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchInput
        value={searchQuery}
        onChange={onChangeSearch}
        placeholder="Buscar pessoas ou mensagens…"
        accessibilityLabel="Buscar pessoas ou mensagens"
        testID="inbox-search-input"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScrollOuter}
        contentContainerStyle={styles.chipScroll}
      >
        {chips.map((spec) => (
          <FilterChip
            key={spec.id}
            spec={spec}
            active={activeFilter === spec.id}
            onPress={onChangeFilter}
          />
        ))}
      </ScrollView>

      {emptyLabel ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      ) : showingRequests ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={requests}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RequestRow
              request={item}
              onAccept={onAcceptRequest}
              onIgnore={onIgnoreRequest}
            />
          )}
        />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={conversations}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <DmRow dm={item} onPress={onOpenDm} />}
        />
      )}
    </SafeAreaView>
  );
}
