import type { Place, WeatherForecast } from './types';

const PREFIX = 'soklaro:forecast:';
const LAST_PLACE_KEY = 'soklaro:last-place';
const SAVED_PLACES_KEY = 'soklaro:saved-places';
const GEOLOCATION_DEFAULT_KEY = 'soklaro:geolocation-default';
const MAX_SAVED_PLACES = 8;
export const MAX_CACHE_AGE = 6 * 60 * 60 * 1000;

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const place = value as Partial<Place>;
  return typeof place.id === 'string' && typeof place.name === 'string'
    && Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
}

export function saveLastPlace(place: Place): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place));
}

export function readLastPlace(): Place | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LAST_PLACE_KEY);
  if (!raw) return null;
  try {
    const place = JSON.parse(raw) as unknown;
    if (!isPlace(place)) throw new Error('Invalid place');
    return place;
  } catch {
    localStorage.removeItem(LAST_PLACE_KEY);
    return null;
  }
}

export function readSavedPlaces(): Place[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(SAVED_PLACES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Invalid places');
    return parsed.filter(isPlace).slice(0, MAX_SAVED_PLACES);
  } catch {
    localStorage.removeItem(SAVED_PLACES_KEY);
    return [];
  }
}

export function rememberPlace(place: Place): Place[] {
  if (typeof localStorage === 'undefined') return [place];
  const places = readSavedPlaces();
  const existingIndex = places.findIndex((candidate) => candidate.id === place.id
    || (candidate.id.startsWith('geo:') && place.id.startsWith('geo:')));
  if (existingIndex >= 0) places[existingIndex] = place;
  else places.push(place);
  const saved = places.slice(-MAX_SAVED_PLACES);
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(saved));
  return saved;
}

export function forgetPlace(placeId: string): Place[] {
  if (typeof localStorage === 'undefined') return [];
  const saved = readSavedPlaces().filter((place) => place.id !== placeId);
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(saved));
  return saved;
}

export function setGeolocationDefault(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GEOLOCATION_DEFAULT_KEY, String(enabled));
}

export function readGeolocationDefault(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(GEOLOCATION_DEFAULT_KEY) === 'true';
}

export function cacheForecast(forecast: WeatherForecast): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${PREFIX}${forecast.place.id}`, JSON.stringify({ savedAt: Date.now(), forecast }));
}

export function readCachedForecast(placeId: string): { forecast: WeatherForecast; age: number; stale: boolean } | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(`${PREFIX}${placeId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { savedAt: number; forecast: WeatherForecast };
    const age = Date.now() - parsed.savedAt;
    return { forecast: { ...parsed.forecast, source: 'cache' }, age, stale: age > MAX_CACHE_AGE };
  } catch {
    localStorage.removeItem(`${PREFIX}${placeId}`);
    return null;
  }
}

export function clearLocalData(): void {
  if (typeof localStorage !== 'undefined') localStorage.clear();
}
