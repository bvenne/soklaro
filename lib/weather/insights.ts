import type { WeatherForecast } from './types';

const twelveHoursInMilliseconds = 12 * 60 * 60 * 1_000;

function localTimestamp(value: string): number {
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return Number.NaN;
  return Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]));
}

export function deriveInsight(forecast: WeatherForecast, referenceTime = forecast.current.time): string {
  const currentTime = localTimestamp(referenceTime);
  const rain = forecast.hourly.find((hour) => {
    const distance = localTimestamp(hour.time) - currentTime;
    return distance >= 0 && distance <= twelveHoursInMilliseconds
      && hour.precipitationProbability >= 55
      && hour.precipitation > 0;
  });
  if (rain) return `Regen wahrscheinlich ab ${rain.time.slice(11, 16)}.`;
  return 'Kein Regen in Sicht.';
}
