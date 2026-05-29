import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/shared/icons';
import type { IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { AvailableMessageActions } from './messageActionPolicy';
import { styles } from './styles';

export type MessageActionId = 'reply' | 'edit' | 'delete';

interface MessageActionSheetProps {
  /** Truncated message content shown in the header. Pass an empty string for
   * messages with no text (media-only) — the caption alone still anchors the
   * sheet. */
  messagePreview: string;
  available: AvailableMessageActions;
  onClose: () => void;
  onSelect: (action: MessageActionId) => void;
}

interface ActionItem {
  id: MessageActionId;
  label: string;
  sub: string;
  icon: IconName;
  danger?: boolean;
}

const REPLY_ITEM: ActionItem = {
  id: 'reply',
  label: 'Responder',
  sub: 'Citar e responder esta mensagem',
  icon: 'chat',
};

const EDIT_ITEM: ActionItem = {
  id: 'edit',
  label: 'Editar',
  sub: 'Alterar o texto desta mensagem',
  icon: 'edit',
};

const DELETE_ITEM: ActionItem = {
  id: 'delete',
  label: 'Apagar',
  sub: 'Apagar para todos da conversa',
  icon: 'trash',
  danger: true,
};

const PREVIEW_MAX = 80;

function truncatePreview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, PREVIEW_MAX)}…`;
}

export function MessageActionSheet({
  messagePreview,
  available,
  onClose,
  onSelect,
}: MessageActionSheetProps) {
  const items: ActionItem[] = [];
  if (available.canReply) items.push(REPLY_ITEM);
  if (available.canEdit) items.push(EDIT_ITEM);
  if (available.canDelete) items.push(DELETE_ITEM);

  // Defensive: the screen should not open the sheet when no actions are
  // available; if it does, render nothing rather than an empty card.
  if (items.length === 0) return null;

  const preview = truncatePreview(messagePreview);

  return (
    <View style={styles.sheetOverlay} testID='message-action-sheet'>
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessibilityRole='button'
        accessibilityLabel='Fechar menu'
        testID='message-action-sheet-backdrop'
      />
      <View style={styles.sheetCard}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetAnchorTile}>
            <Icon
              name='chat'
              size={18}
              color={colors.primary}
              strokeWidth={2}
            />
          </View>
          <View style={styles.sheetHeaderText}>
            <Text
              style={styles.sheetHeaderTitle}
              numberOfLines={1}
              testID='message-action-sheet-preview'
            >
              {preview || 'Mensagem'}
            </Text>
            <Text style={styles.sheetHeaderSubtitle}>MENSAGEM</Text>
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
              testID={`message-action-${item.id}`}
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
