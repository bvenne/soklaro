import { expect, it, vi } from 'vitest';
import { RadarImageCache, type RadarImage } from './radar-image-cache';

const image = (url: string, bytes = 4): RadarImage => ({
  url,
  bytes,
  dispose: vi.fn(),
});
const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

it('coalesces concurrent requests and reuses decoded images on subsequent visits', async () => {
  const loader = vi.fn(async (url: string) => image(url));
  const cache = new RadarImageCache(loader);
  const a = cache.load('a');
  expect(cache.load('a', true)).toBe(a);
  const loaded = await a;
  expect(await cache.load('a')).toBe(loaded);
  expect(loader).toHaveBeenCalledTimes(1);
  cache.clear();
  expect(loaded.dispose).toHaveBeenCalledOnce();
});

it('limits concurrency and gives the requested frame priority over queued preloads', async () => {
  const started: string[] = [];
  const resolve = new Map<string, (value: RadarImage) => void>();
  const cache = new RadarImageCache(
    (url) => {
      started.push(url);
      return new Promise((yes) => resolve.set(url, yes));
    },
    100,
    1,
  );
  const a = cache.load('a'),
    b = cache.load('b'),
    c = cache.load('c');
  void cache.load('c', true);
  expect(started).toEqual(['a']);
  resolve.get('a')!(image('a'));
  await a;
  await flush();
  expect(started).toEqual(['a', 'c']);
  resolve.get('c')!(image('c'));
  await c;
  await flush();
  expect(started).toEqual(['a', 'c', 'b']);
  resolve.get('b')!(image('b'));
  await b;
  await flush();
  cache.clear();
});

it('cancels obsolete queued and active requests and releases late-arriving images', async () => {
  let resolve!: (value: RadarImage) => void;
  let signal!: AbortSignal;
  const loader = vi.fn((_url: string, currentSignal: AbortSignal) => {
    signal = currentSignal;
    return new Promise<RadarImage>((yes) => {
      resolve = yes;
    });
  });
  const cache = new RadarImageCache(loader, 100, 1);
  const a = cache.load('a').catch((error) => error);
  const b = cache.load('b').catch((error) => error);
  cache.stop();
  expect(signal.aborted).toBe(true);
  expect((await a).name).toBe('AbortError');
  expect((await b).name).toBe('AbortError');
  const late = image('a');
  resolve(late);
  await flush();
  expect(late.dispose).toHaveBeenCalledOnce();
  expect(loader).toHaveBeenCalledTimes(1);
  expect(cache.has('a')).toBe(false);
});

it('evicts least-recently-used frames but keeps the currently visible image pinned', async () => {
  const loaded = new Map<string, RadarImage>();
  const cache = new RadarImageCache(
    async (url) => {
      const result = image(url, 4);
      loaded.set(url, result);
      return result;
    },
    8,
    1,
  );
  await cache.load('a');
  await flush();
  cache.pin('a');
  await cache.load('b');
  await flush();
  await cache.load('c');
  await flush();
  expect(cache.has('a')).toBe(true);
  expect(cache.has('b')).toBe(false);
  expect(cache.has('c')).toBe(true);
  expect(loaded.get('b')!.dispose).toHaveBeenCalledOnce();
  cache.stop();
  expect(cache.has('a')).toBe(true);
  cache.clear();
  expect(loaded.get('a')!.dispose).toHaveBeenCalledOnce();
  expect(loaded.get('c')!.dispose).toHaveBeenCalledOnce();
});

it('keeps no more than 24 frames even when transparent images are tiny', async () => {
  const cache = new RadarImageCache(async (url) => image(url, 1));
  for (let index = 0; index < 30; index++) {
    await cache.load(String(index));
    await flush();
  }
  expect(cache.has('0')).toBe(false);
  expect(cache.has('5')).toBe(false);
  expect(cache.has('6')).toBe(true);
  expect(cache.has('29')).toBe(true);
  cache.clear();
});

it('recovers after a failed image request rather than stalling the queue', async () => {
  const loader = vi.fn(async (url: string) => {
    if (url === 'bad') throw new Error('network failed');
    return image(url);
  });
  const cache = new RadarImageCache(loader, 100, 1);
  const failed = cache.load('bad').catch((error) => error);
  const good = cache.load('good');
  expect((await failed).message).toBe('network failed');
  expect((await good).url).toBe('good');
  await flush();
  cache.clear();
});
