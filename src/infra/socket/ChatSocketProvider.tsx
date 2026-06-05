import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/application/stores/auth.store';
import { createChatSocket } from './chat-socket';

type AnyHandler = (payload: any) => void;

/**
 * Backstop the typed `event: string` contract at runtime. An `undefined`/empty
 * event name (e.g. a stale `@localloop/shared-types` where an event constant is
 * missing) serializes as `[null, …]` in the Socket.IO protocol, which the
 * server rejects as a malformed packet and closes the connection. Throw in dev
 * so it surfaces immediately; in production log and drop the frame rather than
 * killing the live socket. Returns whether the event is safe to emit.
 */
function isValidEventName(event: string): boolean {
  if (typeof event === 'string' && event.length > 0) {
    return true;
  }
  const message = `[chat-socket] refusing to emit with invalid event name: ${String(
    event,
  )}`;
  if (__DEV__) {
    throw new Error(message);
  }
  console.error(message);
  return false;
}

export interface ChatSocketSubscription {
  key: string;
  subscribe: () => void;
  unsubscribe: () => void;
}

export interface ChatSocketManager {
  connected: boolean;
  emit: (event: string, payload: unknown) => void;
  emitWithAck: (
    event: string,
    payload: unknown,
    timeoutMs: number,
    callback: (error: Error | null, payload?: unknown) => void,
  ) => void;
  addListener: <T>(
    event: string,
    handler: (payload: T) => void,
  ) => () => void;
  subscribe: (subscription: ChatSocketSubscription) => () => void;
}

interface SubscriptionEntry {
  count: number;
  subscribe: () => void;
  unsubscribe: () => void;
}

const ChatSocketContext = createContext<ChatSocketManager | null>(null);

export function ChatSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const socketRef = useRef<Socket | null>(null);
  const subscriptionsRef = useRef<Map<string, SubscriptionEntry>>(new Map());
  const listenersRef = useRef<Map<string, Set<AnyHandler>>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      subscriptionsRef.current.clear();
      listenersRef.current.clear();
      setConnected(false);
      return;
    }

    const socket = createChatSocket(accessToken);
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      for (const entry of subscriptionsRef.current.values()) {
        entry.subscribe();
      }
    };
    const onDisconnect = () => {
      setConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    for (const [event, handlers] of listenersRef.current.entries()) {
      for (const handler of handlers) {
        socket.on(event, handler);
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      for (const [event, handlers] of listenersRef.current.entries()) {
        for (const handler of handlers) {
          socket.off(event, handler);
        }
      }
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [accessToken]);

  const emit = useCallback((event: string, payload: unknown) => {
    if (!isValidEventName(event)) {
      return;
    }
    socketRef.current?.emit(event, payload);
  }, []);

  const emitWithAck = useCallback(
    (
      event: string,
      payload: unknown,
      timeoutMs: number,
      callback: (error: Error | null, payload?: unknown) => void,
    ) => {
      if (!isValidEventName(event)) {
        callback(new Error(`invalid chat socket event name: ${String(event)}`));
        return;
      }
      const socket = socketRef.current;
      if (!socket) {
        callback(new Error('chat socket not connected'));
        return;
      }
      socket.timeout(timeoutMs).emit(event, payload, callback);
    },
    [],
  );

  const addListener = useCallback(
    <T,>(event: string, handler: (payload: T) => void) => {
      const listeners = listenersRef.current;
      let bag = listeners.get(event);
      if (!bag) {
        bag = new Set();
        listeners.set(event, bag);
      }
      const wrapped = handler as AnyHandler;
      bag.add(wrapped);
      socketRef.current?.on(event, wrapped);
      return () => {
        const currentBag = listeners.get(event);
        if (!currentBag) return;
        currentBag.delete(wrapped);
        if (currentBag.size === 0) listeners.delete(event);
        socketRef.current?.off(event, wrapped);
      };
    },
    [],
  );

  const subscribe = useCallback((sub: ChatSocketSubscription) => {
    const subs = subscriptionsRef.current;
    const existing = subs.get(sub.key);
    if (existing) {
      existing.count += 1;
    } else {
      subs.set(sub.key, {
        count: 1,
        subscribe: sub.subscribe,
        unsubscribe: sub.unsubscribe,
      });
      if (socketRef.current?.connected) {
        sub.subscribe();
      }
    }
    return () => {
      const entry = subs.get(sub.key);
      if (!entry) return;
      entry.count -= 1;
      if (entry.count <= 0) {
        subs.delete(sub.key);
        if (socketRef.current?.connected) {
          sub.unsubscribe();
        }
      }
    };
  }, []);

  const value = useMemo<ChatSocketManager>(
    () => ({ connected, emit, emitWithAck, addListener, subscribe }),
    [connected, emit, emitWithAck, addListener, subscribe],
  );

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocketManager(): ChatSocketManager {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error(
      'useChatSocketManager must be used inside ChatSocketProvider',
    );
  }
  return ctx;
}
