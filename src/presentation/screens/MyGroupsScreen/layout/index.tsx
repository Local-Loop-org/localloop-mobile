import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { MyGroupRow } from '@/shared/ui/MyGroupRow';
import { FilterChip } from './FilterChip';
import { SearchInput } from './SearchInput';
import { styles } from './styles';
import type { MyGroupsLayoutProps } from './types';

export default function MyGroupsLayout({
  groups,
  total,
  unreadTotal,
  query,
  filter,
  chips,
  loading,
  onChangeQuery,
  onChangeFilter,
  onPressGroup,
  onPressBack,
}: MyGroupsLayoutProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPressBack}
          accessibilityRole='button'
          accessibilityLabel='Voltar'
          style={styles.headerBack}
        >
          <Icon name='back' size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meus grupos</Text>
          <Text style={styles.headerSubtitle}>
            {`${total} GRUPOS`}
            {unreadTotal > 0 ? (
              <Text style={styles.headerSubtitleAccent}>
                {` · ${unreadTotal} NÃO LIDAS`}
              </Text>
            ) : null}
          </Text>
        </View>
      </View>

      <SearchInput value={query} onChange={onChangeQuery} />

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
            active={filter === spec.id}
            onPress={onChangeFilter}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size='large' />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nada por aqui agora.</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <MyGroupRow group={item} onPress={onPressGroup} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
