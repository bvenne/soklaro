import { afterEach, expect, it, vi } from 'vitest';
import { OpenMeteoWeatherProvider } from './open-meteo';
import { berlin } from './mock';
afterEach(() => vi.unstubAllGlobals());
it('assigns preceding-hour sunshine to the displayed start and keeps 48 cards', async () => {
  const time = Array.from({ length: 49 }, (_, i) => new Date(Date.UTC(2026, 8, 14, 8 + i)).toISOString().slice(0, 16));
  const sunshine = Array.from({ length: 49 }, (_, i) => i * 60);
  const fetchMock = vi.fn(async (_url: string) => ({ ok: true, json: async () => ({
    timezone: 'Europe/Berlin', timezone_abbreviation: 'CEST',
    current: { time: time[0] }, hourly: { time, sunshine_duration: sunshine }, daily: { time: [] },
  }) }));
  vi.stubGlobal('fetch', fetchMock);
  const forecast = await new OpenMeteoWeatherProvider().getForecast(berlin);
  expect(new URL(fetchMock.mock.calls[0][0] as string).searchParams.get('forecast_days')).toBe('15');
  expect(forecast.hourly).toHaveLength(48);
  expect(forecast.hourly[0].sunshineDuration).toBe(60);
  expect(forecast.hourly[47].sunshineDuration).toBe(2880);
});
it('retains all daily detail hours while starting the 48-hour strip at the current hour', async () => {
  const time = Array.from({ length: 360 }, (_, i) => new Date(Date.UTC(2026, 8, 14, i)).toISOString().slice(0, 16));
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({
    timezone: 'Europe/Berlin', timezone_abbreviation: 'CEST',
    current: { time: '2026-09-14T08:45' },
    hourly: { time, precipitation: time.map((_, i) => i / 10) }, daily: { time: [] },
  }) })));
  const forecast = await new OpenMeteoWeatherProvider().getForecast(berlin);
  expect(forecast.hourly).toHaveLength(48);
  expect(forecast.hourly[0].time).toBe('2026-09-14T08:00');
  expect(forecast.detailHourly).toHaveLength(360);
  expect(forecast.detailHourly?.[0].time).toBe('2026-09-14T00:00');
  expect(forecast.detailHourly?.[0].precipitation).toBe(.1);
  expect(forecast.detailHourly?.[0].temperature).toBeNaN();
});
