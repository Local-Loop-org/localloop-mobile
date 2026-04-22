// src/application/hooks/useCurrentLocation.ts

import { useCallback, useState } from "react";
import * as Location from "expo-location";

export interface Coords {
  lat: number;
  lng: number;
}

export type LocationErrorKind = "permission_denied" | "fetch_failed";

interface UseCurrentLocationState {
  coords: Coords | null;
  granted: boolean;
  loading: boolean;
  error: LocationErrorKind | null;
}

/**
 * Requests foreground location permission and fetches the current device coords.
 * Used by OnboardingScreen and CreateGroupScreen. Returns `null` on failure;
 * callers decide how to surface the error (Alert, inline text, etc.).
 */
export function useCurrentLocation() {
  const [state, setState] = useState<UseCurrentLocationState>({
    coords: null,
    granted: false,
    loading: false,
    error: null,
  });

  const request = useCallback(async (): Promise<Coords | null> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState({
          coords: null,
          granted: false,
          loading: false,
          error: "permission_denied",
        });
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords: Coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setState({ coords, granted: true, loading: false, error: null });
      return coords;
    } catch {
      setState({
        coords: null,
        granted: false,
        loading: false,
        error: "fetch_failed",
      });
      return null;
    }
  }, []);

  return { ...state, request };
}
