import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlace, readGeolocationDefault, readLastPlace, readLocationPrecisionDefault, readSavedPlaces, rememberPlace, saveLastPlace, setGeolocationDefault, setLocationPrecisionDefault } from './cache';
import { berlin, hamburg } from './mock';

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

  it('places an allowed GPS location before searched places and keeps it first when selecting another place', () => {
    rememberPlace(hamburg);
    rememberPlace(berlin);
    const gps = { ...berlin, id: 'geo:52.5,13.4', name: 'Dein Standort' };
    expect(rememberPlace(gps)).toEqual([gps, hamburg, berlin]);
    expect(rememberPlace(berlin)).toEqual([gps, hamburg, berlin]);
    expect(readSavedPlaces()).toEqual([gps, hamburg, berlin]);
  });

  it('restores GPS first from older storage without changing the order of other places', () => {
    const gps = { ...berlin, id: 'geo:52.5,13.4' };
    localStorage.setItem('soklaro:saved-places', JSON.stringify([hamburg, gps, berlin]));
    expect(readSavedPlaces()).toEqual([gps, hamburg, berlin]);
  });

  it('keeps the updated GPS place first and forgets its previous position', () => {
    rememberPlace(hamburg);
    rememberPlace({ ...berlin, id: 'geo:52.5,13.4' });
    rememberPlace(berlin);
    const gps = { ...berlin, id: 'geo:52.4,13.1', name: 'Potsdam' };
    expect(rememberPlace(gps)).toEqual([gps, hamburg, berlin]);
    expect(readSavedPlaces()).toEqual([gps, hamburg, berlin]);
  });

  it('does not evict the GPS place when the saved-place limit is reached', () => {
    const gps = { ...berlin, id: 'geo:52.5,13.4' };
    rememberPlace(gps);
    const searched = Array.from({ length: 10 }, (_, index) => ({ ...berlin, id: `city:${index}`, name: `City ${index}` }));
    for (const place of searched) rememberPlace(place);
    expect(readSavedPlaces()).toEqual([gps, ...searched.slice(-7)]);
    expect(forgetPlace(gps.id)).toEqual(searched.slice(-7));
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

  it('allows selection of a new place when persistence is full', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); },
    });
    expect(() => saveLastPlace(berlin)).not.toThrow();
    expect(rememberPlace(berlin)).toEqual([berlin]);
  });

  it('can initialise when storage reads are blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
    });
    expect(readLastPlace()).toBeNull();
    expect(readSavedPlaces()).toEqual([]);
    expect(readGeolocationDefault()).toBe(false);
    expect(readLocationPrecisionDefault()).toBe('private');
  });
});
