import { useCallback, useMemo, useState } from 'react';
import type {
  ChatMessage,
  ChatMessageReplyTo,
} from '@localloop/shared-types';
import type {
  ChatComposerEditState,
  ChatComposerReplyTo,
} from '@/shared/ui/chat/ChatComposer';
import { truncateReplySnippet } from '@/shared/ui/chat/replySnippet';

interface ComposingReplyTarget {
  id: string;
  authorId: string;
  authorName: string;
  snippet: string;
}

interface ComposingEditTarget {
  id: string;
  originalContent: string;
  stashedDraft: string;
}

export interface UseChatComposerStateInput {
  messages: ChatMessage[];
  currentUserId: string | null;
  /** Fires for a brand-new message send. The hook trims content before calling. */
  onSendNew: (input: {
    content: string;
    replyTo: ChatMessageReplyTo | null;
  }) => void;
  /** Fires for an edit. Must resolve on success and reject on failure — the
   * hook surfaces failures via `editError` for the inline banner. */
  onEditMessage: (input: {
    messageId: string;
    content: string;
  }) => Promise<unknown>;
  /** Localized failure copy for the inline error banner. */
  editErrorMessage?: string;
}

export interface UseChatComposerStateResult {
  draft: string;
  composingReplyTo: ChatComposerReplyTo | null;
  composingEdit: ChatComposerEditState | null;
  editError: string | null;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  openReplyComposerFor: (messageId: string) => void;
  openEditComposerFor: (messageId: string) => void;
  onDismissEditError: () => void;
}

const DEFAULT_EDIT_ERROR = 'Não foi possível editar a mensagem.';

/**
 * Owns the chat composer state machine shared by `GroupChatScreen` and
 * `DmChatScreen`: text draft, reply/edit mutex with stash-restore, send
 * branching (new vs. edit), and the inline edit-error banner state.
 *
 * The screen container provides the send + edit callables (each wraps the
 * conversation-specific mutation). Everything else — including the mutex
 * between reply and edit, the chip view-models, and error UX — is owned here
 * so containers stay thin.
 */
export function useChatComposerState({
  messages,
  currentUserId,
  onSendNew,
  onEditMessage,
  editErrorMessage = DEFAULT_EDIT_ERROR,
}: UseChatComposerStateInput): UseChatComposerStateResult {
  const [draft, setDraft] = useState('');
  const [composingReplyTo, setComposingReplyTo] =
    useState<ComposingReplyTarget | null>(null);
  const [composingEdit, setComposingEdit] =
    useState<ComposingEditTarget | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const openReplyComposerFor = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const snippet = truncateReplySnippet(target.content);
      if (!snippet) return;
      // Mutex with edit: restore the stashed draft before swapping modes.
      setComposingEdit((currentEdit) => {
        if (currentEdit) setDraft(currentEdit.stashedDraft);
        return null;
      });
      setComposingReplyTo({
        id: target.id,
        authorId: target.senderId,
        authorName: target.senderName,
        snippet,
      });
    },
    [messages],
  );

  const openEditComposerFor = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const content = target.content ?? '';
      setComposingReplyTo(null);
      setComposingEdit((currentEdit) => {
        // Edit-A → edit-B keeps the original stash, not the prior message's content.
        const stashedDraft = currentEdit ? currentEdit.stashedDraft : draft;
        return { id: target.id, originalContent: content, stashedDraft };
      });
      setDraft(content);
      setEditError(null);
    },
    [messages, draft],
  );

  const cancelEdit = useCallback(() => {
    setComposingEdit((current) => {
      if (!current) return null;
      setDraft(current.stashedDraft);
      return null;
    });
  }, []);

  const onSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (composingEdit) {
      const messageId = composingEdit.id;
      setDraft('');
      setComposingEdit(null);
      onEditMessage({ messageId, content: trimmed })
        .then(() => setEditError(null))
        .catch(() => setEditError(editErrorMessage));
      return;
    }
    onSendNew({
      content: trimmed,
      replyTo: composingReplyTo
        ? {
            id: composingReplyTo.id,
            authorId: composingReplyTo.authorId,
            snippet: composingReplyTo.snippet,
            isDeleted: false,
          }
        : null,
    });
    setDraft('');
    setComposingReplyTo(null);
  }, [
    draft,
    composingEdit,
    composingReplyTo,
    onEditMessage,
    onSendNew,
    editErrorMessage,
  ]);

  const composerReplyTo = useMemo<ChatComposerReplyTo | null>(() => {
    if (!composingReplyTo) return null;
    const isMe = composingReplyTo.authorId === currentUserId;
    const firstName =
      composingReplyTo.authorName.split(' ')[0] ?? composingReplyTo.authorName;
    return {
      authorLabel: isMe ? 'Você' : firstName,
      originalText: composingReplyTo.snippet,
      onCancel: () => setComposingReplyTo(null),
    };
  }, [composingReplyTo, currentUserId]);

  const composerEdit = useMemo<ChatComposerEditState | null>(
    () => (composingEdit ? { onCancel: cancelEdit } : null),
    [composingEdit, cancelEdit],
  );

  const onDismissEditError = useCallback(() => setEditError(null), []);

  return {
    draft,
    composingReplyTo: composerReplyTo,
    composingEdit: composerEdit,
    editError,
    onChangeDraft: setDraft,
    onSend,
    openReplyComposerFor,
    openEditComposerFor,
    onDismissEditError,
  };
}
