import { afterEach, expect, it, vi } from 'vitest';
import { OpenMeteoGeocodingProvider, OpenMeteoWeatherProvider } from './open-meteo';
import { hamburg } from './mock';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it.each([[429, 'rate-limit'], [503, 'http']])('reports HTTP %s distinctly', async (status, kind) => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status })));
  await expect(new OpenMeteoGeocodingProvider().search('Kiel')).rejects.toMatchObject({ kind, status });
});

it('distinguishes a failed connection from a malformed response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  await expect(new OpenMeteoGeocodingProvider().search('Torba')).rejects.toMatchObject({ kind: 'network' });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } })));
  await expect(new OpenMeteoGeocodingProvider().search('Torba')).rejects.toMatchObject({ kind: 'invalid-data' });
});

it('allows a slow forecast past ten seconds and reports a timeout at its actual deadline', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn((_url: string, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  vi.stubGlobal('fetch', fetchMock);
  const pending = new OpenMeteoWeatherProvider().getForecast(hamburg);
  const expectation = expect(pending).rejects.toMatchObject({ kind: 'timeout' });
  await vi.advanceTimersByTimeAsync(10_001);
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(9_999);
  await expectation;
});

it('preserves user cancellation instead of describing it as a network error', async () => {
  const controller = new AbortController();
  vi.stubGlobal('fetch', vi.fn((_url: string, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true });
  })));
  const pending = new OpenMeteoGeocodingProvider().search('Bodrum', controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
});
