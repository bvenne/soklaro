import type { GeocodingProvider, Place, WeatherForecast, WeatherPoint, WeatherProvider } from './types';

declare const __OPEN_METEO_URL__: string;
declare const __OPEN_METEO_GEOCODING_URL__: string;

const hourlyFields = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'is_day', 'precipitation',
  'precipitation_probability', 'relative_humidity_2m', 'cloud_cover', 'dew_point_2m',
  'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'surface_pressure',
  'visibility', 'uv_index',
].join(',');

const dailyFields = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min',
  'precipitation_probability_max', 'precipitation_sum', 'sunshine_duration', 'sunrise', 'sunset',
].join(',');
const currentFields = ['temperature_2m','relative_humidity_2m','apparent_temperature','is_day','precipitation','weather_code','cloud_cover','surface_pressure','wind_speed_10m','wind_direction_10m','wind_gusts_10m'].join(',');

type ApiConfig = { forecastBaseUrl?: string; geocodingBaseUrl?: string; mode?: 'public' | 'customer' | 'self-hosted' };

function numberAt(values: unknown[] | undefined, index: number, fallback = 0): number {
  const value = values?.[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), 10_000);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : `http-${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  private readonly base: string;
  constructor(config: ApiConfig = {}) {
    const configured = typeof __OPEN_METEO_URL__ !== 'undefined' ? __OPEN_METEO_URL__ : undefined;
    this.base = (config.forecastBaseUrl ?? configured ?? 'https://api.open-meteo.com').replace(/\/$/, '');
  }

  async getForecast(place: Place, signal?: AbortSignal): Promise<WeatherForecast> {
    const params = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude), timezone: 'auto',
      forecast_days: '14', forecast_hours: '48', models: 'best_match',
      current: currentFields, hourly: hourlyFields, daily: dailyFields,
    });
    const data = await fetchJson(`${this.base}/v1/forecast?${params}`, signal);
    const point = (index: number): WeatherPoint => ({
      time: data.hourly.time[index], temperature: numberAt(data.hourly.temperature_2m, index),
      apparentTemperature: numberAt(data.hourly.apparent_temperature, index), weatherCode: numberAt(data.hourly.weather_code, index),
      isDay: Boolean(numberAt(data.hourly.is_day, index)), precipitation: numberAt(data.hourly.precipitation, index),
      precipitationProbability: numberAt(data.hourly.precipitation_probability, index), humidity: numberAt(data.hourly.relative_humidity_2m, index), dewPoint: numberAt(data.hourly.dew_point_2m, index),
      cloudCover: numberAt(data.hourly.cloud_cover, index), windSpeed: numberAt(data.hourly.wind_speed_10m, index),
      windDirection: numberAt(data.hourly.wind_direction_10m, index), windGusts: numberAt(data.hourly.wind_gusts_10m, index),
      pressure: numberAt(data.hourly.surface_pressure, index), visibility: numberAt(data.hourly.visibility, index), uvIndex: numberAt(data.hourly.uv_index, index),
    });
    const currentIndex = Math.max(0, data.hourly.time.indexOf(data.current.time));
    const current = { ...point(currentIndex), time: data.current.time,
      temperature: data.current.temperature_2m ?? point(currentIndex).temperature,
      apparentTemperature: data.current.apparent_temperature ?? point(currentIndex).apparentTemperature,
      weatherCode: data.current.weather_code ?? point(currentIndex).weatherCode,
      isDay: Boolean(data.current.is_day ?? point(currentIndex).isDay),
    };
    return {
      place, timezone: data.timezone, timezoneAbbreviation: data.timezone_abbreviation,
      updatedAt: new Date().toISOString(), current,
      hourly: data.hourly.time.map((_: string, index: number) => point(index)),
      daily: data.daily.time.map((date: string, index: number) => ({
        date, weatherCode: numberAt(data.daily.weather_code, index), temperatureMax: numberAt(data.daily.temperature_2m_max, index),
        temperatureMin: numberAt(data.daily.temperature_2m_min, index), precipitationProbability: numberAt(data.daily.precipitation_probability_max, index),
        precipitationSum: numberAt(data.daily.precipitation_sum, index), sunshineDuration: numberAt(data.daily.sunshine_duration, index),
        sunrise: data.daily.sunrise[index], sunset: data.daily.sunset[index],
      })), source: 'live',
    };
  }
}

export class OpenMeteoGeocodingProvider implements GeocodingProvider {
  private readonly base: string;
  constructor(config: ApiConfig = {}) {
    const configured = typeof __OPEN_METEO_GEOCODING_URL__ !== 'undefined' ? __OPEN_METEO_GEOCODING_URL__ : undefined;
    this.base = (config.geocodingBaseUrl ?? configured ?? 'https://geocoding-api.open-meteo.com').replace(/\/$/, '');
  }
  async search(query: string, signal?: AbortSignal): Promise<Place[]> {
    if (query.trim().length < 2) return [];
    const params = new URLSearchParams({ name: query.trim(), count: '8', language: 'de', format: 'json' });
    const data = await fetchJson(`${this.base}/v1/search?${params}`, signal);
    return (data.results ?? []).map((item: any) => ({
      id: String(item.id), name: item.name, admin: item.admin1, country: item.country,
      latitude: item.latitude, longitude: item.longitude, timezone: item.timezone,
    }));
  }
}
