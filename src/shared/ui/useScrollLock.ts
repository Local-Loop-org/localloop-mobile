import { useCallback, useState } from 'react';

export interface ScrollLock {
  /** Bind to a ScrollView's `scrollEnabled`. */
  scrollEnabled: boolean;
  /** Call when a nested gesture surface (e.g. an embedded map) is touched. */
  lock: () => void;
  /** Call when that gesture ends/cancels. */
  unlock: () => void;
}

/**
 * Lets a screen lock its own `ScrollView` while the user manipulates a nested
 * pannable surface (the embedded `RadiusMapPicker`), so the two don't fight for
 * vertical pan gestures. Shared by CreateGroup and GroupDetail rather than
 * re-declared in each layout.
 */
export function useScrollLock(): ScrollLock {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const lock = useCallback(() => setScrollEnabled(false), []);
  const unlock = useCallback(() => setScrollEnabled(true), []);
  return { scrollEnabled, lock, unlock };
}
