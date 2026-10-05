import type { Place, WeatherForecast } from './types';
import type { LocationPrecision } from './geolocation';

const PREFIX = 'soklaro:forecast:';
const LAST_PLACE_KEY = 'soklaro:last-place';
const SAVED_PLACES_KEY = 'soklaro:saved-places';
const GEOLOCATION_DEFAULT_KEY = 'soklaro:geolocation-default';
const LOCATION_PRECISION_KEY = 'soklaro:location-precision';
const MAX_SAVED_PLACES = 8;
export const MAX_CACHE_AGE = 6 * 60 * 60 * 1000;

function readStoredValue(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); }
  catch { return null; }
}

function writeStoredValue(key: string, value: string): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); }
  catch { /* Weather and place selection remain usable when browser storage is full or blocked. */ }
}

function removeStoredValue(key: string): void {
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); }
  catch { /* Browser storage is optional. */ }
}

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const place = value as Partial<Place>;
  return typeof place.id === 'string' && typeof place.name === 'string'
    && Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
}

export function saveLastPlace(place: Place): void {
  writeStoredValue(LAST_PLACE_KEY, JSON.stringify(place));
}

export function readLastPlace(): Place | null {
  const raw = readStoredValue(LAST_PLACE_KEY);
  if (!raw) return null;
  try {
    const place = JSON.parse(raw) as unknown;
    if (!isPlace(place)) throw new Error('Invalid place');
    return place;
  } catch {
    removeStoredValue(LAST_PLACE_KEY);
    return null;
  }
}

export function readSavedPlaces(): Place[] {
  const raw = readStoredValue(SAVED_PLACES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Invalid places');
    return parsed.filter(isPlace).slice(0, MAX_SAVED_PLACES);
  } catch {
    removeStoredValue(SAVED_PLACES_KEY);
    return [];
  }
}

export function rememberPlace(place: Place): Place[] {
  const places = readSavedPlaces();
  const existingIndex = places.findIndex((candidate) => candidate.id === place.id
    || (candidate.id.startsWith('geo:') && place.id.startsWith('geo:')));
  if (existingIndex >= 0) places[existingIndex] = place;
  else places.push(place);
  const saved = places.slice(-MAX_SAVED_PLACES);
  writeStoredValue(SAVED_PLACES_KEY, JSON.stringify(saved));
  return saved;
}

export function forgetPlace(placeId: string): Place[] {
  const saved = readSavedPlaces().filter((place) => place.id !== placeId);
  writeStoredValue(SAVED_PLACES_KEY, JSON.stringify(saved));
  return saved;
}

export function setGeolocationDefault(enabled: boolean): void {
  writeStoredValue(GEOLOCATION_DEFAULT_KEY, String(enabled));
}

export function readGeolocationDefault(): boolean {
  return readStoredValue(GEOLOCATION_DEFAULT_KEY) === 'true';
}

export function setLocationPrecisionDefault(precision: LocationPrecision | null): void {
  if (precision === null) removeStoredValue(LOCATION_PRECISION_KEY);
  else writeStoredValue(LOCATION_PRECISION_KEY, precision);
}

export function readLocationPrecisionDefault(): LocationPrecision {
  const precision = readStoredValue(LOCATION_PRECISION_KEY);
  return precision === 'exact' || precision === 'approximate' || precision === 'private'
    ? precision
    : 'private';
}

export function cacheForecast(forecast: WeatherForecast): void {
  writeStoredValue(`${PREFIX}${forecast.place.id}`, JSON.stringify({ savedAt: Date.now(), forecast }));
}

export function readCachedForecast(placeId: string): { forecast: WeatherForecast; age: number; stale: boolean } | null {
  const raw = readStoredValue(`${PREFIX}${placeId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { savedAt: number; forecast: WeatherForecast };
    const age = Date.now() - parsed.savedAt;
    return { forecast: { ...parsed.forecast, source: 'cache' }, age, stale: age > MAX_CACHE_AGE };
  } catch {
    removeStoredValue(`${PREFIX}${placeId}`);
    return null;
  }
}

export function clearLocalData(): void {
  try { if (typeof localStorage !== 'undefined') localStorage.clear(); }
  catch { /* Browser storage may be inaccessible. */ }
}
