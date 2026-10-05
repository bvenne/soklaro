import { afterEach, expect, it, vi } from 'vitest';
import { cacheForecast } from './cache';
import { loadForecast } from './load-forecast';
import { hamburg, mockForecast } from './mock';
import { WeatherRequestError } from './request-error';
import type { WeatherForecast } from './types';

afterEach(() => vi.unstubAllGlobals());

function storage() {
  const values = new Map<string, string>();
  const store = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
  vi.stubGlobal('localStorage', store);
  return store;
}

it('keeps live data when saving the forecast exceeds the browser storage quota', async () => {
  const store = storage();
  store.setItem.mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  const live: WeatherForecast = { ...mockForecast(hamburg), source: 'live' };
  const result = await loadForecast({ getForecast: async () => live }, hamburg, new AbortController().signal);
  expect(result).toEqual({ forecast: live, status: 'idle', failure: null });
  expect(store.setItem).toHaveBeenCalled();
  expect(store.getItem).not.toHaveBeenCalled();
});

it('uses the saved forecast and preserves the actual request failure', async () => {
  storage();
  cacheForecast(mockForecast(hamburg));
  const result = await loadForecast({ getForecast: async () => { throw new WeatherRequestError('timeout'); } }, hamburg, new AbortController().signal);
  expect(result.status).toBe('offline');
  expect(result.failure).toBe('timeout');
  expect(result.forecast.source).toBe('cache');
  expect(result.forecast.place).toEqual(hamburg);
});

it('falls back safely when both the network and browser storage reads fail', async () => {
  storage().getItem.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
  const result = await loadForecast({ getForecast: async () => { throw new WeatherRequestError('network'); } }, hamburg, new AbortController().signal);
  expect(result.status).toBe('error');
  expect(result.failure).toBe('network');
  expect(result.forecast.source).toBe('mock');
});

it('ignores a late successful response after the user has cancelled that request', async () => {
  const store = storage();
  const controller = new AbortController();
  let finish!: (forecast: WeatherForecast) => void;
  const pending = loadForecast({ getForecast: () => new Promise(resolve => { finish = resolve; }) }, hamburg, controller.signal);
  controller.abort();
  const expectation = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  finish({ ...mockForecast(hamburg), source: 'live' });
  await expectation;
  expect(store.setItem).not.toHaveBeenCalled();
});

it('does not produce sample data when a cancelled request fails', async () => {
  const store = storage();
  const controller = new AbortController();
  const pending = loadForecast({ getForecast: async () => { controller.abort(); throw new TypeError('Cancelled'); } }, hamburg, controller.signal);
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(store.getItem).not.toHaveBeenCalled();
});
