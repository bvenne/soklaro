import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function PwaRegister() {
  useEffect(() => {
    if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {});
    }
  }, []);
  return null;
}
