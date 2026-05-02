import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DmPermission } from '@localloop/shared-types';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { DmException } from '../types';
import { styles } from './styles';

interface Props {
  value: DmPermission;
  onChange: (next: DmPermission) => void;
  exceptions: DmException[];
  candidates: DmException[];
  onAddException: (id: string) => void;
  onRemoveException: (id: string) => void;
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
  candidates,
  onAddException,
  onRemoveException,
}: Props) {
  return (
    <View style={styles.dmList}>
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        const showExceptions = active && opt.id === DmPermission.NOBODY;
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
                candidates={candidates}
                onAdd={onAddException}
                onRemove={onRemoveException}
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
  candidates: DmException[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function ExceptionsBlock({
  exceptions,
  candidates,
  onAdd,
  onRemove,
}: ExceptionsBlockProps) {
  const [picking, setPicking] = useState(false);

  return (
    <View style={styles.dmExceptionsBlock}>
      <View style={styles.dmExceptionsHeader}>
        <Text style={styles.dmExceptionsHeaderLabel}>
          EXCEÇÕES — PODEM TE ENVIAR DM
        </Text>
        <Text style={styles.dmExceptionsHeaderCount}>{exceptions.length}</Text>
      </View>

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

        <Pressable
          onPress={() => setPicking((s) => !s)}
          style={styles.dmAddBtn}
          accessibilityRole='button'
          accessibilityLabel={picking ? 'Fechar' : 'Adicionar exceção'}
        >
          <Icon
            name='plus'
            size={11}
            color={colors.primary}
            strokeWidth={2.5}
          />
          <Text style={styles.dmAddBtnText}>
            {picking ? 'Fechar' : 'Adicionar'}
          </Text>
        </Pressable>
      </View>

      {picking ? (
        <View style={styles.dmPickerDrawer}>
          {candidates.length === 0 ? (
            <Text style={styles.dmPickerEmpty}>Sem mais sugestões.</Text>
          ) : (
            candidates.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  onAdd(c.id);
                  setPicking(false);
                }}
                style={styles.dmPickerRow}
                accessibilityRole='button'
                accessibilityLabel={`Adicionar ${c.name}`}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dmPickerAvatar}
                >
                  <Text style={styles.dmPickerAvatarLetter}>
                    {c.name
                      .split(' ')
                      .slice(0, 2)
                      .map((s) => s[0] ?? '')
                      .join('')
                      .toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dmPickerName}>{c.name}</Text>
                  <Text style={styles.dmPickerHint}>
                    {c.hint.toUpperCase()}
                  </Text>
                </View>
                <Icon
                  name='plus'
                  size={13}
                  color={colors.primary}
                  strokeWidth={2.5}
                />
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
