import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
export const supportedLocales = ["de","en","fr","es","it","pt","nl","pl","cs","sk","hu","ro","bg","el","da","sv","nb","fi","et","lv","lt","uk","tr","ar","he","hi","zh-CN","zh-TW","ja","ko"] as const;
export const rtlLocales = ['ar', 'he'] as const;
void i18n.use(initReactI18next).init({ resources: { de: { translation: de }, en: { translation: en } }, fallbackLng: 'en', lng: 'de', interpolation: { escapeValue: false } });
export function directionFor(locale: string) { return (rtlLocales as readonly string[]).includes(locale) ? 'rtl' : 'ltr'; }
export default i18n;
