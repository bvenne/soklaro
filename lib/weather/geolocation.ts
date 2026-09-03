import type { Coordinates } from './types';

export type LocationPrecision = 'exact' | 'approximate' | 'private';
export type GeolocationResult =
  | { status: 'allowed'; coordinates: Coordinates; accuracy: number }
  | { status: 'denied' | 'blocked' | 'unavailable' | 'timeout' | 'inaccurate' };

export function roundCoordinates(value: Coordinates, precision: LocationPrecision): Coordinates {
  const decimals = precision === 'exact' ? 5 : precision === 'approximate' ? 2 : 1;
  return { latitude: Number(value.latitude.toFixed(decimals)), longitude: Number(value.longitude.toFixed(decimals)) };
}

export async function requestLocation(): Promise<GeolocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return { status: 'unavailable' };
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
    (position) => position.coords.accuracy > 10_000
      ? resolve({ status: 'inaccurate' })
      : resolve({ status: 'allowed', coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude }, accuracy: position.coords.accuracy }),
    (error) => resolve({ status: error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable' }),
    { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
  ));
}
