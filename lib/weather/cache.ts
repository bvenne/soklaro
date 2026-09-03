import type { Place, WeatherForecast } from './types';

const PREFIX = 'openaura:forecast:';
const LAST_PLACE_KEY = 'openaura:last-place';
export const MAX_CACHE_AGE = 6 * 60 * 60 * 1000;

export function saveLastPlace(place: Place): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place));
}

export function readLastPlace(): Place | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LAST_PLACE_KEY);
  if (!raw) return null;
  try {
    const place = JSON.parse(raw) as Partial<Place>;
    if (typeof place.id !== 'string' || typeof place.name !== 'string'
      || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) throw new Error('Invalid place');
    return place as Place;
  } catch {
    localStorage.removeItem(LAST_PLACE_KEY);
    return null;
  }
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
