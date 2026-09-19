import { expect, it } from 'vitest';
import { radarTimes, radarFrames, nearestRadarFrame, RADAR_WINDOW } from './radar';

it('pins forecast requests to the latest run and historical images to their own observation', () => {
  const now = Date.parse('2026-09-19T10:03:00Z');
  const refs = radarTimes('2026-09-19T08:00:00Z/2026-09-19T10:00:00Z/PT5M', 6);
  const valid = radarTimes('2026-09-19T08:00:00Z/2026-09-19T12:00:00Z/PT5M', 6);
  const frames = radarFrames(valid, refs, now);
  const start = nearestRadarFrame(frames, now - 20 * 60000)!;
  expect(start.forecast).toBe(false);
  expect(start.reference).toBe(start.time);
  expect(now - start.time).toBeGreaterThanOrEqual(15 * 60000);
  expect(now - start.time).toBeLessThanOrEqual(30 * 60000);
  const future = nearestRadarFrame(frames, now + 60 * 60000)!;
  expect(future.forecast).toBe(true);
  expect(future.reference).toBe(Date.parse('2026-09-19T10:00:00Z'));
  expect(nearestRadarFrame(frames, now + RADAR_WINDOW)).toBeUndefined();
  expect(nearestRadarFrame([], now)).toBeUndefined();
});

it('does not turn a missing historical observation into a forecast', () => {
  const now = Date.parse('2026-09-19T10:00:00Z');
  expect(radarFrames([now - 300000, now, now + 300000], [now], now)).toEqual([
    { time: now, reference: now, forecast: false },
    { time: now + 300000, reference: now, forecast: true },
  ]);
});

it('uses the actual advertised latest observation and limits playback to two hours', () => {
  const times = radarTimes('2026-09-17T12:00:00Z/2026-09-18T12:00:00Z/PT5M');
  expect(times).toHaveLength(25);
  expect(times[0]).toBe(Date.parse('2026-09-18T10:00:00Z'));
  expect(times.at(-1)).toBe(Date.parse('2026-09-18T12:00:00Z'));
});
it('preserves missing observations in explicit lists and rejects invalid intervals', () => {
  expect(radarTimes('2026-09-18T12:00:00Z,invalid,2026-09-18T11:40:00Z,2026-09-18T12:00:00Z')).toEqual([Date.parse('2026-09-18T11:40:00Z'), Date.parse('2026-09-18T12:00:00Z')]);
  expect(radarTimes('2026-09-18T10:00:00Z/2026-09-18T12:00:00Z/PT0M')).toEqual([]);
  expect(radarTimes('invalid')).toEqual([]);
});
