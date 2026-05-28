import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import type { IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Avatar from '@/shared/ui/Avatar';
import { styles } from './styles';

export type DmActionId =
  | 'profile'
  | 'mute'
  | 'clear'
  | 'archive'
  | 'block'
  | 'report';

interface DmActionSheetProps {
  peerName: string;
  peerAvatarUrl: string | null;
  /** Whether the conversation is currently archived — toggles the
   * archive item's label between "Arquivar" and "Desarquivar". */
  archived?: boolean;
  onClose: () => void;
  onSelect: (action: DmActionId) => void;
}

interface ActionItem {
  id: DmActionId;
  label: string;
  icon: IconName;
  sub: string;
  danger?: boolean;
}

function buildItems(peerFirstName: string, archived: boolean): ActionItem[] {
  return [
    {
      id: 'profile',
      label: 'Ver perfil',
      icon: 'users',
      sub: `Abrir perfil de ${peerFirstName}`,
    },
    {
      id: 'mute',
      label: 'Silenciar',
      icon: 'bell',
      sub: 'Sem notificações desta conversa',
    },
    {
      id: 'archive',
      label: archived ? 'Desarquivar conversa' : 'Arquivar conversa',
      icon: 'logout',
      sub: archived
        ? 'Voltar a mostrar na lista'
        : 'Esconder da lista até nova mensagem',
    },
    {
      id: 'clear',
      label: 'Limpar conversa',
      icon: 'trash',
      sub: 'Apagar mensagens só para você',
    },
    {
      id: 'block',
      label: 'Bloquear',
      icon: 'shield',
      sub: `Não receber mais mensagens de ${peerFirstName}`,
      danger: true,
    },
    {
      id: 'report',
      label: 'Denunciar',
      icon: 'x',
      sub: 'Reportar comportamento abusivo',
      danger: true,
    },
  ];
}

export function DmActionSheet({
  peerName,
  peerAvatarUrl,
  archived = false,
  onClose,
  onSelect,
}: DmActionSheetProps) {
  const peerFirstName = peerName.split(' ')[0] || peerName;
  const items = buildItems(peerFirstName, archived);

  return (
    <View style={styles.sheetOverlay} testID='dm-action-sheet'>
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessibilityRole='button'
        accessibilityLabel='Fechar menu'
        testID='dm-action-sheet-backdrop'
      />
      <View style={styles.sheetCard}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Avatar name={peerName} uri={peerAvatarUrl} size={42} />
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetHeaderTitle} numberOfLines={1}>
              {peerName}
            </Text>
            <Text style={styles.sheetHeaderSubtitle}>OPÇÕES DA CONVERSA</Text>
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
              testID={`dm-action-${item.id}`}
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
