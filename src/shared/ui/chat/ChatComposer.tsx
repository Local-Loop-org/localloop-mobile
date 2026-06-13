import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { EditPreviewChip } from './EditPreviewChip';
import { ReplyPreviewChip } from './ReplyPreviewChip';
import { createStyles } from './styles';

export interface ChatComposerReplyTo {
  authorLabel: string;
  originalText: string;
  onCancel: () => void;
}

export interface ChatComposerEditState {
  onCancel: () => void;
}

interface ChatComposerProps {
  draft: string;
  placeholder?: string;
  /** When set, shows a `ReplyPreviewChip` above the composer bar. */
  composingReplyTo?: ChatComposerReplyTo | null;
  /** When set, shows an `EditPreviewChip` above the composer bar. Mutually exclusive with `composingReplyTo` (enforced by the container). */
  composingEdit?: ChatComposerEditState | null;
  /** Omit to render the input as a non-editable preview (used by mockups). */
  onChangeDraft?: (value: string) => void;
  onSend?: () => void;
  onPressAttach?: () => void;
  sendDisabled?: boolean;
  /** Disables the text input + send button (e.g. send-text permission denied). */
  textDisabled?: boolean;
  /** Disables the attach button (e.g. send-media permission denied). */
  attachDisabled?: boolean;
  /** When set, shows a muted hint row above the bar explaining why it's disabled. */
  disabledHint?: string | null;
  /** Whether to show a small mic icon at the right of the input when empty. */
  showMicIconWhenEmpty?: boolean;
}

export function ChatComposer({
  draft,
  placeholder = 'Escreva uma mensagem',
  composingReplyTo,
  composingEdit,
  onChangeDraft,
  onSend,
  onPressAttach,
  sendDisabled,
  textDisabled,
  attachDisabled,
  disabledHint,
  showMicIconWhenEmpty = true,
}: ChatComposerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const editable = typeof onChangeDraft === 'function' && !textDisabled;
  const hasChip = !!(composingReplyTo || composingEdit);
  return (
    <>
      {disabledHint ? (
        <View style={styles.composerDisabledHint}>
          <Text
            style={styles.composerDisabledHintText}
            testID='composer-disabled-hint'
          >
            {disabledHint}
          </Text>
        </View>
      ) : null}
      {composingReplyTo && (
        <ReplyPreviewChip
          authorLabel={composingReplyTo.authorLabel}
          originalText={composingReplyTo.originalText}
          onCancel={composingReplyTo.onCancel}
        />
      )}
      {composingEdit && <EditPreviewChip onCancel={composingEdit.onCancel} />}
      <View
        style={[styles.composerBar, hasChip && styles.composerBarNoTopBorder]}
      >
        <Pressable
          style={[
            styles.composerAttachBtn,
            attachDisabled && styles.composerAttachBtnDisabled,
          ]}
          onPress={onPressAttach}
          disabled={attachDisabled}
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
