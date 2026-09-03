import { describe, expect, it } from 'vitest';
import { backgroundFor, interpretWmo, knownWmoCodes } from './wmo';

describe('WMO mapping', () => {
  it('covers every Open-Meteo documented WMO code', () => {
    expect(knownWmoCodes).toEqual([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
    for (const code of knownWmoCodes) expect(interpretWmo(code).kind).not.toBe('fallback');
  });
  it('uses a safe future-code fallback', () => expect(interpretWmo(1234)).toMatchObject({ kind: 'fallback', severity: 'moderate' }));
  it('distinguishes day and night assets', () => { expect(backgroundFor(0, true)).toContain('clear-day'); expect(backgroundFor(0, false)).toContain('clear-night'); });
});
