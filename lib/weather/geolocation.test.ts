import { describe, expect, it } from 'vitest';
import { roundCoordinates } from './geolocation';
describe('privacy coordinate rounding', () => {
  const berlin = { latitude: 52.520008, longitude: 13.404954 };
  it('keeps useful exact precision', () => expect(roundCoordinates(berlin, 'exact')).toEqual({ latitude: 52.52001, longitude: 13.40495 }));
  it('rounds approximate coordinates', () => expect(roundCoordinates(berlin, 'approximate')).toEqual({ latitude: 52.52, longitude: 13.4 }));
  it('rounds private coordinates', () => expect(roundCoordinates(berlin, 'private')).toEqual({ latitude: 52.5, longitude: 13.4 }));
});
