import type { ChatMessage } from '@localloop/shared-types';

export type ChatSendStatus = 'sending' | 'sent' | 'error';

export type ChatMessageWithSendStatus<T extends ChatMessage = ChatMessage> =
  T & {
    /**
     * Mobile-only optimistic delivery state. This is never serialized by the
     * API; it lives only in the React Query cache for temporary messages.
     */
    sendStatus?: ChatSendStatus;
  };

export function getLocalSendStatus(
  message: ChatMessage,
): ChatSendStatus | null {
  const status = (message as ChatMessageWithSendStatus).sendStatus;
  return status === 'sending' || status === 'sent' || status === 'error'
    ? status
    : null;
}
