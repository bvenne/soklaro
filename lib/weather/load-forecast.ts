import { cacheForecast, readCachedForecast } from './cache';
import { mockForecast } from './mock';
import { WeatherRequestError, type WeatherFailure } from './request-error';
import type { Place, WeatherForecast, WeatherProvider } from './types';

export type ForecastResult = {
  forecast: WeatherForecast;
  status: 'idle' | 'offline' | 'error';
  failure: WeatherFailure | null;
};

function checkCancellation(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Forecast request cancelled', 'AbortError');
}

export async function loadForecast(provider: WeatherProvider, place: Place, signal: AbortSignal): Promise<ForecastResult> {
  checkCancellation(signal);
  let forecast: WeatherForecast;
  try {
    forecast = await provider.getForecast(place, signal);
  } catch (error) {
    checkCancellation(signal);
    const failure = error instanceof WeatherRequestError ? error.kind : 'invalid-data';
    const cached = readCachedForecast(place.id);
    return cached
      ? { forecast: cached.forecast, status: 'offline', failure }
      : { forecast: mockForecast(place), status: 'error', failure };
  }
  checkCancellation(signal);
  // Persistence is optional; it must never send a successful request through the fallback path.
  cacheForecast(forecast);
  return { forecast, status: 'idle', failure: null };
}
