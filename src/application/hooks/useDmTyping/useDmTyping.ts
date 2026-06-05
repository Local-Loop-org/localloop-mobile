import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChatSocketEvents,
  type DmTypingUpdate,
} from '@localloop/shared-types';
import { useChatSocketManager } from '@/infra/socket/ChatSocketProvider';

/**
 * Receiver-side: how long we keep showing "typing" without a refresh before
 * auto-clearing. Covers a dropped stop event (peer's socket died mid-type).
 */
const PEER_TYPING_TIMEOUT_MS = 6000;
/** Sender-side: while the user keeps typing, re-assert "typing" at most this often. */
const TYPING_THROTTLE_MS = 3000;
/** Sender-side: after this long without a keystroke, tell the peer we stopped. */
const TYPING_IDLE_MS = 4000;

export interface UseDmTypingResult {
  /** True while the peer is actively typing in this conversation. */
  peerTyping: boolean;
  /** Call on each keystroke — throttles "typing" emits and arms the idle stop. */
  notifyTyping: () => void;
  /** Call on send / when the input clears — emits "stopped" immediately. */
  notifyStopTyping: () => void;
}

/**
 * Bidirectional DM typing indicator over the chat socket.
 *
 * Unlike {@link useDmPresence}, this needs no watch/unwatch: both participants
 * already share the DM room via `join_dm` (emitted by `useDmChat`), so the API
 * relays `DM_TYPING` straight into that room. We ignore our own echo by peerId.
 */
export function useDmTyping(peerId: string): UseDmTypingResult {
  const manager = useChatSocketManager();
  const [peerTyping, setPeerTyping] = useState(false);

  // Receiver-side auto-clear timer.
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sender-side bookkeeping.
  const typingActiveRef = useRef(false);
  const lastEmitRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- receive the peer's typing state ---
  useEffect(() => {
    setPeerTyping(false);
    if (peerId.length === 0) return;

    const stopShowingTyping = () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setPeerTyping(false);
    };

    const handleTypingUpdate = (payload: DmTypingUpdate) => {
      if (payload.peerId !== peerId) return;
      if (!payload.isTyping) {
        stopShowingTyping();
        return;
      }
      setPeerTyping(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null;
        setPeerTyping(false);
      }, PEER_TYPING_TIMEOUT_MS);
    };

    const offTyping = manager.addListener<DmTypingUpdate>(
      ChatSocketEvents.DM_TYPING_UPDATE,
      handleTypingUpdate,
    );

    return () => {
      offTyping();
      stopShowingTyping();
    };
  }, [manager, peerId]);

  // --- send our own typing state ---
  const emitStop = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    lastEmitRef.current = 0;
    if (peerId.length === 0) return;
    manager.emit(ChatSocketEvents.DM_TYPING, {
      recipientId: peerId,
      isTyping: false,
    });
  }, [manager, peerId]);

  const notifyTyping = useCallback(() => {
    if (peerId.length === 0) return;

    // (Re)arm the idle stop so a pause in typing notifies the peer.
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      emitStop();
    }, TYPING_IDLE_MS);

    // Throttle the "still typing" emits so we don't fire on every keystroke.
    const now = Date.now();
    if (
      typingActiveRef.current &&
      now - lastEmitRef.current < TYPING_THROTTLE_MS
    ) {
      return;
    }
    typingActiveRef.current = true;
    lastEmitRef.current = now;
    manager.emit(ChatSocketEvents.DM_TYPING, {
      recipientId: peerId,
      isTyping: true,
    });
  }, [manager, peerId, emitStop]);

  const notifyStopTyping = useCallback(() => {
    emitStop();
  }, [emitStop]);

  // Emit a stop and clear timers when leaving the conversation (or switching peer).
  useEffect(() => emitStop, [emitStop]);

  return { peerTyping, notifyTyping, notifyStopTyping };
}
