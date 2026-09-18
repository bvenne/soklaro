import { expect, it } from 'vitest';
import { knownWmoCodes, statusBarColorFor } from './wmo';

it('provides an opaque status-bar color for every weather condition and period', () => {
  for (const code of knownWmoCodes) {
    expect(statusBarColorFor(code, true)).toMatch(/^#[0-9a-f]{6}$/);
    expect(statusBarColorFor(code, false)).toMatch(/^#[0-9a-f]{6}$/);
  }
  expect(statusBarColorFor(0, true)).not.toBe(statusBarColorFor(0, false));
});
