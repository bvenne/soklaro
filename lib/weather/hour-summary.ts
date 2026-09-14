import type { WeatherPoint } from './types';
import { interpretWmo } from './wmo';

export function hourSummary(hour: WeatherPoint) {
  const condition = interpretWmo(hour.weatherCode);
  const fallback = { code: hour.weatherCode, label: condition.label };
  const seconds = hour.sunshineDuration;
  // Preserve night icons, missing data, fog and all precipitation/hazard codes.
  if (!hour.isDay || seconds == null || !Number.isFinite(seconds)
    || !['clear', 'mostly-clear', 'partly-cloudy', 'overcast'].includes(condition.kind)) return fallback;
  const minutes = Math.max(0, Math.min(60, seconds / 60));
  // Display thresholds: do not equate sunshine through cloud with cloudless sky.
  if (minutes >= 5) {
    if (minutes >= 45 && hour.cloudCover <= 20) return { code: 0, label: 'Sonnig' };
    if (minutes >= 30 && hour.cloudCover <= 50) return { code: 1, label: 'Überwiegend sonnig' };
    return { code: 2, label: 'Sonne und Wolken' };
  }
  return fallback;
}
