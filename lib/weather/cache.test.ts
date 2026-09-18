import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlace, readGeolocationDefault, readLastPlace, readLocationPrecisionDefault, readSavedPlaces, rememberPlace, saveLastPlace, setGeolocationDefault, setLocationPrecisionDefault } from './cache';
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

  it('remembers searched places without duplicates', () => {
    rememberPlace(berlin);
    rememberPlace(berlin);
    const hamburg = { ...berlin, id: 'hamburg', name: 'Hamburg' };
    rememberPlace(hamburg);
    expect(readSavedPlaces()).toEqual([berlin, hamburg]);
    expect(forgetPlace(berlin.id)).toEqual([hamburg]);
  });

  it('replaces an earlier GPS position instead of collecting stale positions', () => {
    rememberPlace({ ...berlin, id: 'geo:52.5,13.4', name: 'Berlin' });
    const potsdam = { ...berlin, id: 'geo:52.4,13.1', name: 'Potsdam' };
    rememberPlace(potsdam);
    expect(readSavedPlaces()).toEqual([potsdam]);
  });

  it('persists whether geolocation is the default', () => {
    expect(readGeolocationDefault()).toBe(false);
    setGeolocationDefault(true);
    expect(readGeolocationDefault()).toBe(true);
    setGeolocationDefault(false);
    expect(readGeolocationDefault()).toBe(false);
  });

  it('persists a valid default geolocation precision and can forget it', () => {
    expect(readLocationPrecisionDefault()).toBe('private');
    setLocationPrecisionDefault('exact');
    expect(readLocationPrecisionDefault()).toBe('exact');
    setLocationPrecisionDefault('approximate');
    expect(readLocationPrecisionDefault()).toBe('approximate');
    setLocationPrecisionDefault(null);
    expect(readLocationPrecisionDefault()).toBe('private');
  });

  it('falls back safely for an invalid stored precision', () => {
    localStorage.setItem('soklaro:location-precision', 'street-level');
    expect(readLocationPrecisionDefault()).toBe('private');
  });
});
