/**
 * Pixel radius for the dashed visibility ring drawn on top of the
 * radius preview map. The map background does not zoom — we just scale
 * the ring linearly with `radiusKm` and clamp so it never clips.
 *
 * The N4 prototype's `VisibilityMapSlider` tried to zoom the map AND
 * scale the ring by `pxPerKm`; the math collapsed to a constant ring
 * radius. This helper mirrors the simpler N3 approach (constant base
 * + linear slope, capped at 45% of the shorter map edge) which was the
 * working version in the prototype canvas.
 */

export const RING_BASE_PX = 14;
export const RING_SLOPE_PX_PER_KM = 6;
export const RING_MAX_FACTOR = 0.45;

export interface MapSize {
  width: number;
  height: number;
}

export function radiusToRingPx(radiusKm: number, size: MapSize): number {
  const max = Math.min(size.width, size.height) * RING_MAX_FACTOR;
  const raw = RING_BASE_PX + radiusKm * RING_SLOPE_PX_PER_KM;
  if (raw < RING_BASE_PX) return RING_BASE_PX;
  if (raw > max) return max;
  return raw;
}

export function formatRadiusKm(value: number): string {
  if (value < 1) return `${Math.round(value * 1000)} m`;
  const hasFraction = value % 1 !== 0;
  return `${value.toFixed(hasFraction ? 1 : 0)} km`;
}
