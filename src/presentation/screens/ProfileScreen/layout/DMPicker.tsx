import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { DmPermission } from '@localloop/shared-types';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { DmException } from '../types';
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
}

function ExceptionsBlock({
  exceptions,
  loading,
  loadingMore,
  error,
  hasMore,
  onRemove,
  onLoadMore,
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
    </View>
  );
}
