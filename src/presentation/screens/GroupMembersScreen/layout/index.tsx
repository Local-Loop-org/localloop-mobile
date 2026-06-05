import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Icon } from '@/shared/icons';
import { Card } from '@/presentation/screens/CreateGroupScreen/layout/atoms/Card';
import { MemberRow } from '@/presentation/screens/GroupDetailScreen/layout/components/MemberRow';
import { RequestRow } from '@/presentation/screens/GroupDetailScreen/layout/components/RequestRow';
import { FilterChip, type ChipSpec } from '@/shared/ui/FilterChip';
import { SearchInput } from '@/shared/ui/SearchInput';
import { StatusSectionHeader } from './components/StatusSectionHeader';
import { BannedMemberRow } from './components/BannedMemberRow';
import { EmptyState } from './components/EmptyState';
import { createStyles } from './styles';
import type { GroupMembersLayoutProps, FilterChipKey } from './types';

function filterByName<T extends { displayName: string }>(
  list: T[],
  query: string,
): T[] {
  if (!query.trim()) return list;
  const needle = query.trim().toLowerCase();
  return list.filter((x) => x.displayName.toLowerCase().includes(needle));
}

export default function GroupMembersLayout({
  groupName,
  myRole,
  canManage,
  currentUserId,
  activeMembers,
  pendingRequests,
  bannedMembers,
  loadingActive,
  loadingPending,
  loadingBanned,
  errorMessage,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  banningUserId,
  unbanningUserId,
  resolvingRequestId,
  onPressMember,
  onBan,
  onUnban,
  onPromote,
  onDemote,
  onApprove,
  onReject,
  onBack,
}: GroupMembersLayoutProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const filteredActive = useMemo(
    () => filterByName(activeMembers, query),
    [activeMembers, query],
  );
  const filteredPending = useMemo(
    () => filterByName(pendingRequests, query),
    [pendingRequests, query],
  );
  const filteredBanned = useMemo(
    () => filterByName(bannedMembers, query),
    [bannedMembers, query],
  );

  const totalCount =
    activeMembers.length +
    (canManage ? pendingRequests.length + bannedMembers.length : 0);

  const chips: ChipSpec<FilterChipKey>[] = canManage
    ? [
        { id: 'all', label: 'Todos', count: totalCount },
        { id: 'active', label: 'Ativos', count: activeMembers.length },
        { id: 'pending', label: 'Pendentes', count: pendingRequests.length },
        { id: 'banned', label: 'Banidos', count: bannedMembers.length },
      ]
    : [];

  const showActive = !canManage || filter === 'all' || filter === 'active';
  const showPending = canManage && (filter === 'all' || filter === 'pending');
  const showBanned = canManage && (filter === 'all' || filter === 'banned');

  const totalVisible =
    (showActive ? filteredActive.length : 0) +
    (showPending ? filteredPending.length : 0) +
    (showBanned ? filteredBanned.length : 0);

  const showInitialLoader =
    loadingActive && activeMembers.length === 0 && !errorMessage;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          testID="group-members-back"
          hitSlop={6}
        >
          <Icon name="back" size={15} color={colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{`Membros · ${totalCount}`}</Text>
          {groupName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {groupName}
            </Text>
          ) : null}
        </View>
      </View>

      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Buscar membros"
        accessibilityLabel="Buscar membros"
        testID="member-search-input"
      />

      {canManage ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScrollOuter}
          contentContainerStyle={styles.chipsRow}
        >
          {chips.map((spec) => (
            <FilterChip
              key={spec.id}
              spec={spec}
              active={filter === spec.id}
              onPress={onFilterChange}
            />
          ))}
        </ScrollView>
      ) : null}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {showInitialLoader ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {totalVisible === 0 ? (
            <EmptyState
              icon="users"
              label={query ? 'Nenhum resultado.' : 'Lista vazia.'}
            />
          ) : null}

          {showActive && filteredActive.length > 0 ? (
            <>
              {canManage && filter === 'all' ? (
                <StatusSectionHeader
                  kind="active"
                  count={filteredActive.length}
                />
              ) : null}
              <Card>
                {filteredActive.map((m, i) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    isLast={i === filteredActive.length - 1}
                    canManage={canManage}
                    viewerRole={myRole}
                    onPress={
                      m.userId === currentUserId ? undefined : onPressMember
                    }
                    onBan={
                      canManage && banningUserId !== m.userId ? onBan : undefined
                    }
                    onPromote={canManage ? onPromote : undefined}
                    onDemote={canManage ? onDemote : undefined}
                  />
                ))}
              </Card>
            </>
          ) : null}

          {showPending && filteredPending.length > 0 ? (
            <>
              <StatusSectionHeader
                kind="pending"
                count={filteredPending.length}
              />
              <Card>
                {filteredPending.map((r, i) => (
                  <RequestRow
                    key={r.id}
                    id={r.id}
                    displayName={r.displayName}
                    meta={metaFromCreatedAt(r.createdAt)}
                    isResolving={resolvingRequestId === r.id}
                    last={i === filteredPending.length - 1}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                ))}
              </Card>
            </>
          ) : null}

          {showPending && filteredPending.length === 0 && !loadingPending ? (
            filter === 'pending' ? (
              <Card>
                <EmptyState
                  icon="check"
                  label={
                    query
                      ? 'Nenhuma solicitação corresponde.'
                      : 'Nenhuma solicitação no momento.'
                  }
                />
              </Card>
            ) : null
          ) : null}

          {showBanned && filteredBanned.length > 0 ? (
            <>
              <StatusSectionHeader
                kind="banned"
                count={filteredBanned.length}
              />
              <Card>
                {filteredBanned.map((b, i) => (
                  <BannedMemberRow
                    key={b.userId}
                    member={b}
                    isLast={i === filteredBanned.length - 1}
                    isUnbanning={unbanningUserId === b.userId}
                    onUnban={onUnban}
                  />
                ))}
              </Card>
            </>
          ) : null}

          {showBanned && filteredBanned.length === 0 && !loadingBanned ? (
            filter === 'banned' ? (
              <Card>
                <EmptyState
                  icon="shield"
                  label={
                    query
                      ? 'Nenhum banimento corresponde.'
                      : 'Ninguém banido.'
                  }
                />
              </Card>
            ) : null
          ) : null}

          {canManage && filter === 'all' && bannedMembers.length > 0 ? (
            <Text style={styles.footerNote}>
              {'BANIDOS NÃO PODEM REENTRAR\nSEM SEREM DESBANIDOS POR UM ADMIN'}
            </Text>
          ) : null}

          {!canManage && myRole !== null ? (
            <Text style={styles.footerNote} testID="group-members-member-footer">
              {`MOSTRANDO ${filteredActive.length} DE ${activeMembers.length} MEMBROS ATIVOS`}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function metaFromCreatedAt(iso: string): string | undefined {
  if (!iso) return undefined;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return undefined;
  const diff = Date.now() - then;
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  if (diff < MIN) return 'AGORA';
  if (diff < HOUR) return `HÁ ${Math.floor(diff / MIN)}M`;
  if (diff < DAY) return `HÁ ${Math.floor(diff / HOUR)}H`;
  const days = Math.floor(diff / DAY);
  return `HÁ ${days}D`;
}
