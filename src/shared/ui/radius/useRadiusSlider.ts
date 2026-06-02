import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderInstance,
} from 'react-native';

/**
 * Shared interaction logic for the radius sliders used by CreateGroup,
 * Profile, and Map. Each screen keeps its own visual layout (track, thumb,
 * ticks, header) and only borrows the gesture handling + value math from
 * here, so the snap/clamp/x→value behaviour stays consistent.
 *
 * - Drag is `locationX`-based (relative to the track view). This matches the
 *   behaviour Profile's slider test pins; CreateGroup has no gesture test.
 * - `snapToStep` reduces both prior implementations to one formula
 *   (CreateGroup snapped to 0.1, Profile to 0.5).
 * - During an active drag a local `draft` value is shown so commit-on-release
 *   callers (Profile) can preview without committing; it resets whenever the
 *   controlled `value` prop changes.
 *
 * Pass `onChange` for continuous updates (CreateGroup), `onCommit` for
 * commit-on-release (Profile), or both.
 */

interface UseRadiusSliderParams {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
}

interface UseRadiusSliderResult {
  /** Attach to the track view's `onLayout`. */
  onTrackLayout: (event: LayoutChangeEvent) => void;
  /** Spread onto the track view to enable dragging. */
  panHandlers: PanResponderInstance['panHandlers'];
  /** Value to render (the live drag draft when dragging, else `value`). */
  displayValue: number;
  /** Filled fraction of the track, clamped to [0, 1]. */
  fillPct: number;
  /** Measured track width in px (0 until first layout). */
  trackWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function useRadiusSlider({
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
}: UseRadiusSliderParams): UseRadiusSliderResult {
  const [trackWidth, setTrackWidth] = useState(0);
  const [draft, setDraft] = useState<number | null>(null);

  // Refs keep the PanResponder closures (created once) reading fresh values.
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);
  const boundsRef = useRef({ min, max, step });
  onChangeRef.current = onChange;
  onCommitRef.current = onCommit;
  boundsRef.current = { min, max, step };

  // A new controlled value supersedes any in-flight drag draft.
  useEffect(() => {
    setDraft(null);
  }, [value]);

  const valueFromLocalX = (x: number): number => {
    const w = widthRef.current;
    const { min: lo, max: hi, step: st } = boundsRef.current;
    if (w <= 0) return value;
    const ratio = clamp(x / w, 0, 1);
    const raw = lo + ratio * (hi - lo);
    return clamp(snapToStep(raw, st), lo, hi);
  };

  const responder = useMemo<PanResponderInstance>(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          const next = valueFromLocalX(event.nativeEvent.locationX);
          setDraft(next);
          onChangeRef.current?.(next);
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
          const next = valueFromLocalX(event.nativeEvent.locationX);
          setDraft(next);
          onChangeRef.current?.(next);
        },
        onPanResponderRelease: (event: GestureResponderEvent) => {
          const next = valueFromLocalX(event.nativeEvent.locationX);
          setDraft(next);
          onCommitRef.current?.(next);
        },
        onPanResponderTerminate: (event: GestureResponderEvent) => {
          const next = valueFromLocalX(event.nativeEvent.locationX);
          setDraft(next);
          onCommitRef.current?.(next);
        },
      }),
    // Created once; all dynamic inputs are read through refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    widthRef.current = w;
    setTrackWidth(w);
  };

  const displayValue = draft ?? value;
  const fillPct = clamp((displayValue - min) / (max - min), 0, 1);

  return {
    onTrackLayout,
    panHandlers: responder.panHandlers,
    displayValue,
    fillPct,
    trackWidth,
  };
}
