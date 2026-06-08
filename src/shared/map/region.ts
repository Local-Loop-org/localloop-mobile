import type { Region } from 'react-native-maps';

/** Approximate kilometres per degree of latitude (used to frame map regions). */
export const KM_PER_DEG_LAT = 111;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Fallback camera until a real device/anchor location resolves — central
 * Curitiba, where the mock discovery data is anchored.
 */
export const FALLBACK_COORDS: LatLng = { lat: -25.4284, lng: -49.2733 };

/**
 * A map `Region` centered on `coords`, framed so a circle of `radiusKm` sits
 * comfortably inside (2.6x the diameter leaves margin at any radius).
 */
export function regionFor({ lat, lng }: LatLng, radiusKm: number): Region {
  const latitudeDelta = Math.max(0.01, (radiusKm * 2.6) / KM_PER_DEG_LAT);
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}
