'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'soklaro:weather-photos';
const EVENT = 'soklaro:weather-photos-changed';
let fallback = true;

function snapshot(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; }
  catch { return fallback; }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', onChange); };
}

export function useWeatherPhotosEnabled(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}

export function setWeatherPhotosEnabled(enabled: boolean, persist = true): void {
  fallback = enabled;
  try {
    if (persist && !enabled) localStorage.setItem(KEY, 'off');
    else localStorage.removeItem(KEY);
  } catch { /* The choice still works for this visit. */ }
  window.dispatchEvent(new Event(EVENT));
}
