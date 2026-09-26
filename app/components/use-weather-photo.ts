'use client';

import { useEffect, useState } from 'react';
import { findCommonsWeatherPhoto, weatherPhotoKey, type WeatherPhoto } from '@/lib/weather/commons-photo';
import type { Place } from '@/lib/weather/types';
import type { WeatherKind } from '@/lib/weather/wmo';

export function useWeatherPhoto(place: Place, kind: WeatherKind, isDay: boolean, enabled: boolean): WeatherPhoto | null {
  const key = weatherPhotoKey(place, kind, isDay);
  const [result, setResult] = useState<{ key: string; photo: WeatherPhoto | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      let cached: { expires: number; photo: WeatherPhoto | null } | null = null;
      try { cached = JSON.parse(sessionStorage.getItem(`soklaro:photo:${key}`) ?? 'null'); } catch { /* Search normally. */ }
      if (cached && cached.expires > Date.now()) {
        setResult({ key, photo: cached.photo });
        return;
      }
      void findCommonsWeatherPhoto(place, kind, isDay, controller.signal).then((photo) => {
        if (controller.signal.aborted) return;
        setResult({ key, photo });
        try { sessionStorage.setItem(`soklaro:photo:${key}`, JSON.stringify({ expires: Date.now() + 86_400_000, photo })); }
        catch { /* Browsers with disabled storage still display the photo. */ }
      }).catch(() => { /* Keep the local backdrop when Commons is unavailable. */ });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [place, kind, isDay, enabled, key]);

  return enabled && result?.key === key ? result.photo : null;
}
