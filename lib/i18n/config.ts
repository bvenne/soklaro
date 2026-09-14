import i18n from 'i18next';
import en from './interface-en.json';

// Only complete interface translations are offered; unfinished locale seeds stay unused.
export const supportedLocales = ['de', 'en'] as const;
export type Locale = typeof supportedLocales[number];
export const LANGUAGE_KEY = 'soklaro:language';
const german = { ...Object.fromEntries(Object.keys(en).map(key => [key, key])),
  Morning: 'Morgen', Noon: 'Mittag', Evening: 'Abend', Night: 'Nacht',
};
void i18n.init({ resources: { de: { translation: german }, en: { translation: en } },
  lng: 'de', fallbackLng: 'en', supportedLngs: [...supportedLocales],
  keySeparator: false, nsSeparator: false, initAsync: false,
  interpolation: { escapeValue: false },
});
export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'de' || base === 'en') return base;
  }
  return 'en';
}
export function preferredLocale(): Locale {
  if (typeof navigator === 'undefined') return 'de';
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch { /* Browser preferences still work when storage is unavailable. */ }
  return resolveLocale(navigator.languages.length ? navigator.languages : [navigator.language]);
}
export function translate(text: string, locale: Locale, values: Record<string, string | number> = {}): string {
  const fixed = i18n.getFixedT(locale);
  if (i18n.exists(text, { lng: locale })) return String(fixed(text, values));
  if (text.includes(' · ')) return text.split(' · ').map(part => translate(part, locale)).join(' · ');
  const rain = /^Regen wahrscheinlich ab (\d{2}:\d{2})\.$/.exec(text);
  if (rain) return String(fixed('Regen wahrscheinlich ab {{time}}.', { time: rain[1] }));
  return text;
}
export function directionFor(_locale: string) { return 'ltr' as const; }
export default i18n;
