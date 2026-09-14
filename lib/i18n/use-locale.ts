'use client';
import { useEffect, useSyncExternalStore } from 'react';
import i18n, { LANGUAGE_KEY, preferredLocale, translate, type Locale } from './config';

const subscribe = (callback: () => void) => {
  i18n.on('languageChanged', callback);
  return () => { i18n.off('languageChanged', callback); };
};
const snapshot = () => (i18n.language === 'de' ? 'de' : 'en') as Locale;
const serverSnapshot = (): Locale => 'de';

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const preference = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(LANGUAGE_KEY) ?? 'auto'; } catch { return 'auto'; }
  }, () => 'auto');
  useEffect(() => {
    const sync = () => { void i18n.changeLanguage(preferredLocale()); };
    sync();
    window.addEventListener('languagechange', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('languagechange', sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    const title = location.pathname === '/privacy' ? 'Netzwerk & Datenschutz' : location.pathname === '/impressum' ? 'Impressum' : 'Dein Wetter';
    document.title = `${translate(title, locale)} · soklaro`;
  }, [locale]);
  return {
    locale,
    preference,
    t: (text: string, values?: Record<string, string | number>) => translate(text, locale, values),
    number: (value: number, digits = 0) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
    setLanguage: (value: string) => {
      try { if (value === 'auto') localStorage.removeItem(LANGUAGE_KEY); else localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Language still changes for this visit. */ }
      void i18n.changeLanguage(value === 'de' || value === 'en' ? value : preferredLocale());
    },
  };
}
