import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, anchorIconName } from '@/shared/icons';
import type { IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { AnchorType } from '@localloop/shared-types';
import { styles } from './styles';

export type GroupActionId =
  | 'details'
  | 'members'
  | 'mute'
  | 'leave'
  | 'report';

interface GroupActionSheetProps {
  groupName: string;
  anchorType: AnchorType;
  /** Omit when not yet available — the subtitle then drops the member prefix. */
  memberCount?: number;
  onlineCount: number;
  onClose: () => void;
  onSelect: (action: GroupActionId) => void;
}

interface ActionItem {
  id: GroupActionId;
  label: string;
  icon: IconName;
  sub: string;
  danger?: boolean;
}

function buildItems(): ActionItem[] {
  return [
    {
      id: 'details',
      label: 'Ver detalhes do grupo',
      icon: 'chat',
      sub: 'Nome, raio, privacidade, permissões',
    },
    {
      id: 'members',
      label: 'Membros',
      icon: 'users',
      sub: 'Ver todos · solicitações pendentes',
    },
    {
      id: 'mute',
      label: 'Silenciar grupo',
      icon: 'bell',
      sub: 'Sem notificações deste grupo',
    },
    {
      id: 'leave',
      label: 'Sair do grupo',
      icon: 'logout',
      sub: 'Você não receberá mais mensagens',
      danger: true,
    },
    {
      id: 'report',
      label: 'Denunciar grupo',
      icon: 'x',
      sub: 'Reportar conteúdo abusivo',
      danger: true,
    },
  ];
}

export function GroupActionSheet({
  groupName,
  anchorType,
  memberCount,
  onlineCount,
  onClose,
  onSelect,
}: GroupActionSheetProps) {
  const items = buildItems();

  return (
    <View style={styles.sheetOverlay} testID='group-action-sheet'>
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessibilityRole='button'
        accessibilityLabel='Fechar menu'
        testID='group-action-sheet-backdrop'
      />
      <View style={styles.sheetCard}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetAnchorTile}>
            <Icon
              name={anchorIconName(anchorType)}
              size={18}
              color={colors.primary}
              strokeWidth={2}
            />
          </View>
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetHeaderTitle} numberOfLines={1}>
              {groupName}
            </Text>
            <Text style={styles.sheetHeaderSubtitle} numberOfLines={1}>
              {memberCount != null
                ? `${memberCount} MEMBROS · ${onlineCount} ONLINE`
                : `${onlineCount} ONLINE`}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.sheetCloseBtn}
            hitSlop={8}
            accessibilityRole='button'
            accessibilityLabel='Fechar menu'
          >
            <Icon name='x' size={15} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.sheetDivider} />
        <View style={styles.sheetList}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={styles.sheetRow}
              accessibilityRole='button'
              accessibilityLabel={item.label}
              testID={`group-action-${item.id}`}
            >
              <View
                style={[
                  styles.sheetIconTile,
                  item.danger && styles.sheetIconTileDanger,
                ]}
              >
                <Icon
                  name={item.icon}
                  size={15}
                  color={item.danger ? colors.error : colors.dim}
                  strokeWidth={1.8}
                />
              </View>
              <View style={styles.sheetRowText}>
                <Text
                  style={[
                    styles.sheetRowLabel,
                    item.danger && styles.sheetRowLabelDanger,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                <Text style={styles.sheetRowSub} numberOfLines={1}>
                  {item.sub}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
