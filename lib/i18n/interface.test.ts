import { expect, it } from 'vitest';
import { resolveLocale, translate } from './config';
import { interpretWmo, knownWmoCodes } from '../weather/wmo';
import en from './interface-en.json';

it('resolves regional browser preferences and uses English for unsupported languages', () => {
  expect(resolveLocale(['de-CH', 'en'])).toBe('de');
  expect(resolveLocale(['en-US', 'de'])).toBe('en');
  expect(resolveLocale(['fr-FR', 'de-DE'])).toBe('de');
  expect(resolveLocale(['ja'])).toBe('en');
});
it('translates day periods, weather qualifiers and dynamic insights without changing codes', () => {
  expect(['Morning', 'Noon', 'Evening', 'Night'].map(key => translate(key, 'de'))).toEqual(['Morgen', 'Mittag', 'Abend', 'Nacht']);
  expect(translate('Sonne und Wolken · zeitweise Regen möglich', 'en')).toBe('Sun and clouds · Occasional rain possible');
  expect(translate('Regen wahrscheinlich ab 19:00.', 'en')).toBe('Rain likely from 19:00.');
  expect(translate('{{name}} entfernen', 'en', { name: 'Berlin' })).toBe('Remove Berlin');
  for (const code of knownWmoCodes) expect(en).toHaveProperty(interpretWmo(code).label);
});
