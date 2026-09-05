import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readLastPlace, saveLastPlace } from './cache';
import { berlin } from './mock';

describe('last selected place', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('restores the last selected place', () => {
    saveLastPlace(berlin);
    expect(readLastPlace()).toEqual(berlin);
  });

  it('discards malformed stored places', () => {
    localStorage.setItem('soklaro:last-place', JSON.stringify({ id: 'broken' }));
    expect(readLastPlace()).toBeNull();
    expect(localStorage.getItem('soklaro:last-place')).toBeNull();
  });
});
