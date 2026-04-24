import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useCurrentLocation } from './useCurrentLocation';

const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetPosition = Location.getCurrentPositionAsync as jest.Mock;

describe('useCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes an idle state before request() is invoked', () => {
    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current).toEqual(
      expect.objectContaining({
        coords: null,
        granted: false,
        loading: false,
        error: null,
      }),
    );
  });

  it('returns coords and sets granted=true when permission is granted', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
    mockedGetPosition.mockResolvedValueOnce({
      coords: { latitude: -23.55, longitude: -46.63 },
    });
    const { result } = renderHook(() => useCurrentLocation());

    let returnedCoords: { lat: number; lng: number } | null = null;
    await act(async () => {
      returnedCoords = await result.current.request();
    });

    expect(returnedCoords).toEqual({ lat: -23.55, lng: -46.63 });
    expect(result.current.coords).toEqual({ lat: -23.55, lng: -46.63 });
    expect(result.current.granted).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null and sets error=permission_denied when permission is denied', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
    const { result } = renderHook(() => useCurrentLocation());

    let returnedCoords: { lat: number; lng: number } | null = { lat: 0, lng: 0 };
    await act(async () => {
      returnedCoords = await result.current.request();
    });

    expect(returnedCoords).toBeNull();
    expect(result.current.coords).toBeNull();
    expect(result.current.granted).toBe(false);
    expect(result.current.error).toBe('permission_denied');
    expect(mockedGetPosition).not.toHaveBeenCalled();
  });

  it('returns null and sets error=fetch_failed when getCurrentPositionAsync throws', async () => {
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
    mockedGetPosition.mockRejectedValueOnce(new Error('gps unavailable'));
    const { result } = renderHook(() => useCurrentLocation());

    let returnedCoords: { lat: number; lng: number } | null = { lat: 0, lng: 0 };
    await act(async () => {
      returnedCoords = await result.current.request();
    });

    expect(returnedCoords).toBeNull();
    expect(result.current.error).toBe('fetch_failed');
    expect(result.current.granted).toBe(false);
  });
});
