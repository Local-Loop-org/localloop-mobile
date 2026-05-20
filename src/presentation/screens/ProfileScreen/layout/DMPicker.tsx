import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { DmPermission } from '@localloop/shared-types';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import type { DmException, DmExceptionPickCandidate } from '../types';
import { styles } from './styles';

interface Props {
  value: DmPermission;
  onChange: (next: DmPermission) => void;
  exceptions: DmException[];
  exceptionsVisible: boolean;
  exceptionsLoading: boolean;
  exceptionsLoadingMore: boolean;
  exceptionsError: boolean;
  exceptionsHasMore: boolean;
  onRemoveException: (id: string) => void;
  onLoadMoreExceptions: () => void;
  candidates: DmExceptionPickCandidate[];
  candidatesLoading: boolean;
  candidatesLoadingMore: boolean;
  candidatesError: boolean;
  candidatesErrorLabel: string | null;
  candidatesHasMore: boolean;
  candidatesPendingId: string | null;
  onAddException: (candidate: DmExceptionPickCandidate) => void;
  onLoadMoreCandidates: () => void;
}

interface OptionSpec {
  id: DmPermission;
  label: string;
  sub: string;
  icon: IconName;
}

const OPTIONS: OptionSpec[] = [
  {
    id: DmPermission.EVERYONE,
    label: 'Todos',
    sub: 'Qualquer um pode te enviar DM',
    icon: 'globe',
  },
  {
    id: DmPermission.MEMBERS,
    label: 'Mesmo grupo',
    sub: 'Só membros de grupos em comum',
    icon: 'users',
  },
  {
    id: DmPermission.NOBODY,
    label: 'Ninguém',
    sub: 'DMs desativadas (com exceções)',
    icon: 'lock',
  },
];

export default function DMPicker({
  value,
  onChange,
  exceptions,
  exceptionsVisible,
  exceptionsLoading,
  exceptionsLoadingMore,
  exceptionsError,
  exceptionsHasMore,
  onRemoveException,
  onLoadMoreExceptions,
  candidates,
  candidatesLoading,
  candidatesLoadingMore,
  candidatesError,
  candidatesErrorLabel,
  candidatesHasMore,
  candidatesPendingId,
  onAddException,
  onLoadMoreCandidates,
}: Props) {
  return (
    <View style={styles.dmList}>
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        const showExceptions =
          active && exceptionsVisible && opt.id !== DmPermission.EVERYONE;
        return (
          <View key={opt.id}>
            <Pressable
              onPress={() => onChange(opt.id)}
              style={[
                styles.dmOption,
                active && styles.dmOptionActive,
                showExceptions && styles.dmOptionWithExceptions,
              ]}
              accessibilityRole='radio'
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
            >
              <View
                style={[
                  styles.dmIconBubble,
                  active && styles.dmIconBubbleActive,
                ]}
              >
                <Icon
                  name={opt.icon}
                  size={13}
                  color={active ? colors.background : colors.textSecondary}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.dmOptionTextWrap}>
                <Text style={styles.dmOptionLabel}>{opt.label}</Text>
                <Text style={styles.dmOptionSub}>{opt.sub}</Text>
              </View>
              {active ? (
                <Icon
                  name='check'
                  size={14}
                  color={colors.primary}
                  strokeWidth={2.5}
                />
              ) : null}
            </Pressable>

            {showExceptions ? (
              <ExceptionsBlock
                exceptions={exceptions}
                loading={exceptionsLoading}
                loadingMore={exceptionsLoadingMore}
                error={exceptionsError}
                hasMore={exceptionsHasMore}
                onRemove={onRemoveException}
                onLoadMore={onLoadMoreExceptions}
                candidates={candidates}
                candidatesLoading={candidatesLoading}
                candidatesLoadingMore={candidatesLoadingMore}
                candidatesError={candidatesError}
                candidatesErrorLabel={candidatesErrorLabel}
                candidatesHasMore={candidatesHasMore}
                candidatesPendingId={candidatesPendingId}
                onAdd={onAddException}
                onLoadMoreCandidates={onLoadMoreCandidates}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

interface ExceptionsBlockProps {
  exceptions: DmException[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  hasMore: boolean;
  onRemove: (id: string) => void;
  onLoadMore: () => void;
  candidates: DmExceptionPickCandidate[];
  candidatesLoading: boolean;
  candidatesLoadingMore: boolean;
  candidatesError: boolean;
  candidatesErrorLabel: string | null;
  candidatesHasMore: boolean;
  candidatesPendingId: string | null;
  onAdd: (candidate: DmExceptionPickCandidate) => void;
  onLoadMoreCandidates: () => void;
}

function ExceptionsBlock({
  exceptions,
  loading,
  loadingMore,
  error,
  hasMore,
  onRemove,
  onLoadMore,
  candidates,
  candidatesLoading,
  candidatesLoadingMore,
  candidatesError,
  candidatesErrorLabel,
  candidatesHasMore,
  candidatesPendingId,
  onAdd,
  onLoadMoreCandidates,
}: ExceptionsBlockProps) {
  return (
    <View style={styles.dmExceptionsBlock}>
      <View style={styles.dmExceptionsHeader}>
        <Text style={styles.dmExceptionsHeaderLabel}>
          EXCEÇÕES — PODEM TE ENVIAR DM
        </Text>
        <Text style={styles.dmExceptionsHeaderCount}>{exceptions.length}</Text>
      </View>

      {loading ? (
        <View style={styles.dmExceptionState} testID='dm-exceptions-loading'>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.dmPickerEmpty}>
          Não foi possível carregar exceções.
        </Text>
      ) : exceptions.length === 0 ? (
        <Text style={styles.dmPickerEmpty}>Nenhuma exceção ativa.</Text>
      ) : (
        <>
          <View style={styles.dmChipsRow}>
            {exceptions.map((c) => (
              <View key={c.id} style={styles.dmChip}>
                <Text style={styles.dmChipText}>{c.name}</Text>
                <Pressable
                  onPress={() => onRemove(c.id)}
                  accessibilityRole='button'
                  accessibilityLabel={`Remover ${c.name}`}
                  style={styles.dmChipRemoveBtn}
                >
                  <Icon
                    name='x'
                    size={9}
                    color={colors.textSecondary}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          {hasMore ? (
            <Pressable
              onPress={onLoadMore}
              disabled={loadingMore}
              style={styles.dmLoadMoreBtn}
              accessibilityRole='button'
              accessibilityLabel='Carregar mais exceções'
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} size='small' />
              ) : (
                <Text style={styles.dmAddBtnText}>Carregar mais</Text>
              )}
            </Pressable>
          ) : null}
        </>
      )}

      <CandidatesDrawer
        candidates={candidates}
        loading={candidatesLoading}
        loadingMore={candidatesLoadingMore}
        error={candidatesError}
        errorLabel={candidatesErrorLabel}
        hasMore={candidatesHasMore}
        pendingId={candidatesPendingId}
        onAdd={onAdd}
        onLoadMore={onLoadMoreCandidates}
      />
    </View>
  );
}

interface CandidatesDrawerProps {
  candidates: DmExceptionPickCandidate[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  errorLabel: string | null;
  hasMore: boolean;
  pendingId: string | null;
  onAdd: (candidate: DmExceptionPickCandidate) => void;
  onLoadMore: () => void;
}

function CandidatesDrawer({
  candidates,
  loading,
  loadingMore,
  error,
  errorLabel,
  hasMore,
  pendingId,
  onAdd,
  onLoadMore,
}: CandidatesDrawerProps) {
  return (
    <View style={styles.dmPickerDrawer}>
      <View style={styles.dmExceptionsHeader}>
        <Text style={styles.dmExceptionsHeaderLabel}>
          ADICIONAR — TOQUE PARA INCLUIR
        </Text>
      </View>

      {loading ? (
        <View style={styles.dmExceptionState} testID='dm-candidates-loading'>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.dmPickerEmpty}>
          {errorLabel ?? 'Não foi possível carregar pessoas.'}
        </Text>
      ) : candidates.length === 0 ? (
        <Text style={styles.dmPickerEmpty}>
          Ninguém disponível para adicionar.
        </Text>
      ) : (
        <>
          {candidates.map((c) => {
            const isPending = pendingId === c.userId;
            return (
              <Pressable
                key={c.userId}
                onPress={() => onAdd(c)}
                disabled={pendingId !== null}
                style={styles.dmPickerRow}
                accessibilityRole='button'
                accessibilityLabel={`Adicionar ${c.displayName}`}
              >
                <Avatar
                  name={c.displayName}
                  uri={c.avatarUrl}
                  size={28}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dmPickerName}>{c.displayName}</Text>
                  {isPending ? (
                    <Text style={styles.dmPickerHint}>ADICIONANDO…</Text>
                  ) : null}
                </View>
                {isPending ? (
                  <ActivityIndicator color={colors.primary} size='small' />
                ) : (
                  <Icon
                    name='plus'
                    size={14}
                    color={colors.primary}
                    strokeWidth={2.5}
                  />
                )}
              </Pressable>
            );
          })}

          {hasMore ? (
            <Pressable
              onPress={onLoadMore}
              disabled={loadingMore}
              style={styles.dmLoadMoreBtn}
              accessibilityRole='button'
              accessibilityLabel='Carregar mais candidatos'
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} size='small' />
              ) : (
                <Text style={styles.dmAddBtnText}>Carregar mais</Text>
              )}
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}
