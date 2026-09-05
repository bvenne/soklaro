import { describe, expect, it } from 'vitest';
import { placeNameFromNominatim } from './reverse-geocoding';

describe('placeNameFromNominatim', () => {
  it('prefers a city and keeps useful administrative context', () => {
    expect(placeNameFromNominatim({ address: { city: 'Berlin', state: 'Berlin', country: 'Deutschland' } }))
      .toEqual({ name: 'Berlin', admin: undefined, country: 'Deutschland' });
  });

  it('falls back to smaller settlements and the display name', () => {
    expect(placeNameFromNominatim({ address: { village: 'Worpswede', county: 'Osterholz', country: 'Deutschland' } }))
      .toEqual({ name: 'Worpswede', admin: 'Osterholz', country: 'Deutschland' });
    expect(placeNameFromNominatim({ display_name: 'Atlantik, Erde' }))
      .toEqual({ name: 'Atlantik', admin: undefined, country: undefined });
  });
});
