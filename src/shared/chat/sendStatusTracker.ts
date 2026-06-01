import type { InfiniteData } from '@tanstack/react-query';
import type { ChatMessage } from '@localloop/shared-types';
import type { ChatMessageWithSendStatus } from './sendStatus';

export const SEND_TIMEOUT_MS = 15_000;

interface PageWithMessages<TMessage extends ChatMessage> {
  data: TMessage[];
}

export function markTempAsError<
  TMessage extends ChatMessage,
  TPage extends PageWithMessages<TMessage>,
>(
  old: InfiniteData<TPage> | undefined,
  clientMessageId: string,
): InfiniteData<TPage> | undefined {
  if (!old) return old;
  let changed = false;
  const pages = old.pages.map((page) => {
    let pageChanged = false;
    const data = page.data.map((message) => {
      if (
        !message.id.startsWith('temp-') ||
        message.clientMessageId !== clientMessageId
      ) {
        return message;
      }
      pageChanged = true;
      changed = true;
      const withStatus: ChatMessageWithSendStatus<TMessage> = {
        ...message,
        sendStatus: 'error',
      };
      return withStatus as TMessage;
    });
    return pageChanged ? { ...page, data } : page;
  });
  return changed ? { ...old, pages } : old;
}

export interface SendTimeoutTracker {
  track(
    clientMessageId: string,
    onTimeout: (clientMessageId: string) => void,
  ): void;
  clear(clientMessageId: string): void;
  clearAll(): void;
}

export function createSendTimeoutTracker(): SendTimeoutTracker {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    track(clientMessageId, onTimeout) {
      const existing = timers.get(clientMessageId);
      if (existing) clearTimeout(existing);
      const handle = setTimeout(() => {
        timers.delete(clientMessageId);
        onTimeout(clientMessageId);
      }, SEND_TIMEOUT_MS);
      timers.set(clientMessageId, handle);
    },
    clear(clientMessageId) {
      const handle = timers.get(clientMessageId);
      if (!handle) return;
      clearTimeout(handle);
      timers.delete(clientMessageId);
    },
    clearAll() {
      for (const handle of timers.values()) {
        clearTimeout(handle);
      }
      timers.clear();
    },
  };
}
