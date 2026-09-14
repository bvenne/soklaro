import { describe, expect, it } from 'vitest';
import { daySummary, sunProgress } from './day-summary';
import { mockForecast } from './mock';
const day = { ...mockForecast().daily[0], sunrise: '2026-09-14T06:30', sunset: '2026-09-14T19:30', weatherCode: 3, precipitationProbability: 10, precipitationSum: 0 };
describe('daily summary', () => {
  it('reflects 8.3 and 11.3 sunshine hours despite an overcast daily maximum', () => {
    expect(daySummary({ ...day, sunshineDuration: 8.3 * 3600 }).code).toBe(1);
    expect(daySummary({ ...day, sunshineDuration: 11.3 * 3600 }).code).toBe(0);
  });
  it('distinguishes possible light rain from meaningful rainfall', () => {
    const rainy = { ...day, weatherCode: 61, sunshineDuration: 6 * 3600, precipitationSum: .2 };
    expect(daySummary(rainy).code).toBe(2);
    expect(daySummary({ ...rainy, precipitationSum: 2 }).code).toBe(80);
    expect(daySummary({ ...rainy, precipitationProbability: 60 }).code).toBe(80);
    expect(daySummary({ ...rainy, weatherCode: 95 }).code).toBe(95);
  });
  it('places the sun at rise, midpoint and set, hiding it at night', () => {
    expect(sunProgress(day, '2026-09-14T06:30')).toBe(0);
    expect(sunProgress(day, '2026-09-14T13:00')).toBe(.5);
    expect(sunProgress(day, '2026-09-14T19:30')).toBe(1);
    expect(sunProgress(day, '2026-09-14T22:00')).toBeNull();
    expect(sunProgress(day, '2026-09-15T13:00')).toBeNull();
  });
});
