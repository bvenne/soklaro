import { expect, it } from 'vitest';
import { mockForecast } from './mock';
import { periodSummaries } from './period-summary';

const hours = () => Array.from({ length: 48 }, (_, i) => ({
  ...mockForecast().hourly[0],
  time: new Date(Date.UTC(2026, 8, 14, i)).toISOString().slice(0, 16),
  isDay: i % 24 >= 6 && i % 24 < 18,
  temperature: i % 24, weatherCode: 3, cloudCover: 70,
  sunshineDuration: 1800, precipitation: .2, precipitationProbability: 20, windSpeed: 12,
}));

it('summarizes the correct six-hour windows and following night', () => {
  const periods = periodSummaries('2026-09-14', hours());
  expect(periods.map(p => p.temperatureMin)).toEqual([6, 12, 18, 0]);
  expect(periods.map(p => p.temperatureMax)).toEqual([11, 17, 23, 5]);
  expect(periods[0].precipitation).toBeCloseTo(1.2);
  expect(periods[0].windSpeed).toBe(12);
  expect(periods[3].isDay).toBe(false);
});
it('uses hourly sunshine and retains isolated hazardous events', () => {
  const data = hours();
  expect(periodSummaries('2026-09-14', data)[0].code).toBe(2);
  data[8].weatherCode = 95;
  expect(periodSummaries('2026-09-14', data)[0].code).toBe(95);
});
it('uses peak probability and does not invent unavailable metrics', () => {
  const data = hours();
  data[8].precipitationProbability = 75;
  data[9].windSpeed = NaN;
  const morning = periodSummaries('2026-09-14', data)[0];
  expect(morning.precipitationProbability).toBe(75);
  expect(morning.windSpeed).toBeNull();
  const missing = periodSummaries('2026-09-14', data.slice(0, 24))[3];
  expect(missing.complete).toBe(false);
  expect(missing.precipitation).toBeNull();
});
