import type { DailyForecast } from './types';
import { interpretWmo } from './wmo';

// Treat provider-local ISO times as wall-clock values, independently of browser timezone.
const wallTime = (iso: string) => Date.parse(iso + 'Z');

export function sunProgress(day: DailyForecast, localNow: string): number | null {
  const rise = wallTime(day.sunrise), set = wallTime(day.sunset), now = wallTime(localNow);
  if (![rise, set, now].every(Number.isFinite) || set <= rise) return null;
  if (now < rise || now > set) return null;
  return (now - rise) / (set - rise);
}

export function daySummary(day: DailyForecast): { code: number; label: string } {
  const original = interpretWmo(day.weatherCode);
  const fallback = { code: day.weatherCode, label: original.label };
  // Never hide frozen precipitation or thunderstorms with a fair-weather summary.
  if (['snow', 'snow-showers', 'freezing', 'thunderstorm', 'extreme', 'fallback'].includes(original.kind)) return fallback;
  const daylight = (wallTime(day.sunset) - wallTime(day.sunrise)) / 1000;
  if (!Number.isFinite(daylight) || daylight <= 0 || !Number.isFinite(day.sunshineDuration)) return fallback;
  const share = Math.max(0, Math.min(1, day.sunshineDuration / daylight));
  // Presentation thresholds, not a replacement for the provider's WMO observation.
  const wet = ['rain', 'showers', 'drizzle'].includes(original.kind);
  if (wet && (day.precipitationProbability >= 40 || day.precipitationSum >= 1)) {
    return share >= .35 ? { code: 80, label: 'Sonne und Schauer' } : fallback;
  }
  if (original.kind === 'fog' && share < .2) return fallback;
  const code = share >= .8 ? 0 : share >= .55 ? 1 : share >= .2 ? 2 : 3;
  const label = ['Sonnig', 'Überwiegend sonnig', 'Sonne und Wolken', 'Überwiegend bewölkt'][code];
  return { code, label: wet ? label + ' · Regen möglich' : label };
}
