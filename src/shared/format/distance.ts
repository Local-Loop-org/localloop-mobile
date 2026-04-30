export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}M`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1).replace('.', ',')}Km`;
  }
  return `${Math.round(km)}Km`;
}
