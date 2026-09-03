import { describe, expect, it } from 'vitest';
import { deriveInsight } from './insights';
import { mockForecast } from './mock';

describe('deterministic local insights', () => {
  it('finds likely rain within the next twelve hours', () => {
    expect(deriveInsight(mockForecast())).toBe('Regen wahrscheinlich ab 16:00.');
  });

  it('does not announce rain more than twelve hours away even when the list starts earlier', () => {
    const forecast = mockForecast();
    forecast.hourly = forecast.hourly.map((hour, index) => ({
      ...hour,
      precipitation: index === 23 ? 0.7 : 0,
      precipitationProbability: index === 23 ? 72 : 18,
    }));

    expect(deriveInsight(forecast, '2026-09-01T15:40')).toBe('Kein Regen in Sicht.');
  });

  it('still includes rain exactly twelve hours away', () => {
    const forecast = mockForecast();
    forecast.hourly = forecast.hourly.map((hour, index) => ({
      ...hour,
      precipitation: index === 12 ? 0.7 : 0,
      precipitationProbability: index === 12 ? 72 : 18,
    }));

    expect(deriveInsight(forecast)).toBe('Regen wahrscheinlich ab 00:00.');
  });

  it('ignores rain entries that are already in the past', () => {
    const forecast = mockForecast();
    forecast.hourly = forecast.hourly.map((hour, index) => ({
      ...hour,
      precipitation: index === 2 ? 0.7 : 0,
      precipitationProbability: index === 2 ? 72 : 18,
    }));

    expect(deriveInsight(forecast, '2026-09-01T15:40')).toBe('Kein Regen in Sicht.');
  });
});
