import type {
  ChatSocketManager,
  ChatSocketSubscription,
} from './ChatSocketProvider';

type Listener = (payload: unknown) => void;

export interface ManagerMockHandle {
  manager: ChatSocketManager;
  fire: (event: string, payload?: unknown) => void;
  setConnected: (value: boolean) => void;
  subscriptions: () => Map<
    string,
    { count: number; subscribe: () => void; unsubscribe: () => void }
  >;
  listenerCount: (event: string) => number;
}

export function makeManagerMock(): ManagerMockHandle {
  const listeners = new Map<string, Set<Listener>>();
  const subs = new Map<
    string,
    { count: number; subscribe: () => void; unsubscribe: () => void }
  >();
  let connected = false;

  const emit = jest.fn();
  const emitWithAck = jest.fn();
  const addListener = jest.fn(
    <T,>(event: string, handler: (payload: T) => void) => {
      let bag = listeners.get(event);
      if (!bag) {
        bag = new Set();
        listeners.set(event, bag);
      }
      const wrapped = handler as Listener;
      bag.add(wrapped);
      return () => {
        const currentBag = listeners.get(event);
        if (!currentBag) return;
        currentBag.delete(wrapped);
        if (currentBag.size === 0) listeners.delete(event);
      };
    },
  );
  const subscribe = jest.fn((sub: ChatSocketSubscription) => {
    const existing = subs.get(sub.key);
    if (existing) {
      existing.count += 1;
    } else {
      subs.set(sub.key, {
        count: 1,
        subscribe: sub.subscribe,
        unsubscribe: sub.unsubscribe,
      });
      if (connected) sub.subscribe();
    }
    return () => {
      const entry = subs.get(sub.key);
      if (!entry) return;
      entry.count -= 1;
      if (entry.count <= 0) {
        subs.delete(sub.key);
        if (connected) sub.unsubscribe();
      }
    };
  });

  const manager: ChatSocketManager = {
    get connected() {
      return connected;
    },
    emit,
    emitWithAck,
    addListener,
    subscribe,
  } as ChatSocketManager;

  return {
    manager,
    fire: (event, payload) => {
      const bag = listeners.get(event);
      if (!bag) return;
      for (const handler of [...bag]) handler(payload);
    },
    setConnected: (value) => {
      const wasConnected = connected;
      connected = value;
      if (!wasConnected && value) {
        for (const entry of [...subs.values()]) entry.subscribe();
      }
    },
    subscriptions: () => subs,
    listenerCount: (event) => listeners.get(event)?.size ?? 0,
  };
}
