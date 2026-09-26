'use client';

import { useSyncExternalStore } from 'react';

export type AppTheme = 'dark' | 'light';

const THEME_KEY = 'soklaro:theme';
const CHANGE_EVENT = 'soklaro:theme-changed';
let fallbackTheme: AppTheme = 'dark';

function readTheme(): AppTheme {
  try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; }
  catch { return fallbackTheme; }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useAppTheme(): AppTheme {
  return useSyncExternalStore(subscribe, readTheme, () => 'dark');
}

export function setAppTheme(theme: AppTheme, persist = true): void {
  fallbackTheme = theme;
  try {
    if (persist) localStorage.setItem(THEME_KEY, theme);
    else localStorage.removeItem(THEME_KEY);
  } catch { /* The page remains usable when browser storage is unavailable. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
