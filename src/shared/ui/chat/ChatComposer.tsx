import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { ReplyPreviewChip } from './ReplyPreviewChip';
import { styles } from './styles';

export interface ChatComposerReplyTo {
  authorLabel: string;
  originalText: string;
  onCancel: () => void;
}

interface ChatComposerProps {
  draft: string;
  placeholder?: string;
  /** When set, shows a `ReplyPreviewChip` above the composer bar. */
  composingReplyTo?: ChatComposerReplyTo | null;
  /** Omit to render the input as a non-editable preview (used by mockups). */
  onChangeDraft?: (value: string) => void;
  onSend?: () => void;
  onPressAttach?: () => void;
  sendDisabled?: boolean;
  /** Whether to show a small mic icon at the right of the input when empty. */
  showMicIconWhenEmpty?: boolean;
}

export function ChatComposer({
  draft,
  placeholder = 'Escreva uma mensagem',
  composingReplyTo,
  onChangeDraft,
  onSend,
  onPressAttach,
  sendDisabled,
  showMicIconWhenEmpty = true,
}: ChatComposerProps) {
  const editable = typeof onChangeDraft === 'function';
  return (
    <>
      {composingReplyTo && (
        <ReplyPreviewChip
          authorLabel={composingReplyTo.authorLabel}
          originalText={composingReplyTo.originalText}
          onCancel={composingReplyTo.onCancel}
        />
      )}
      <View
        style={[
          styles.composerBar,
          composingReplyTo && styles.composerBarNoTopBorder,
        ]}
      >
        <Pressable
          style={styles.composerAttachBtn}
          onPress={onPressAttach}
          accessibilityRole='button'
          accessibilityLabel='Anexar arquivo'
          testID='composer-attach'
        >
          <Icon name='plus' size={18} color={colors.dim} />
        </Pressable>
        <View style={styles.composerInputPill}>
          <TextInput
            style={styles.composerInputTextInput}
            placeholder={placeholder}
            placeholderTextColor={colors.faint}
            value={draft}
            onChangeText={onChangeDraft}
            editable={editable}
            multiline
          />
          {showMicIconWhenEmpty && !draft && (
            <Icon name='mic' size={15} color={colors.faint} strokeWidth={1.8} />
          )}
        </View>
        <Pressable
          style={[
            styles.composerSendBtn,
            sendDisabled && styles.composerSendBtnDisabled,
          ]}
          onPress={onSend}
          disabled={sendDisabled}
          accessibilityRole='button'
          accessibilityLabel='Enviar mensagem'
          testID='composer-send'
        >
          <LinearGradient
            colors={[colors.primary, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Icon name='send' size={15} color={colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>
    </>
  );
}
