'use client';

import { useEffect } from 'react';

export function ThemeColor({ color }: { color: string }) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousMeta = meta?.content;
    const previousHtml = document.documentElement.style.backgroundColor;
    const previousBody = document.body.style.backgroundColor;
    meta?.setAttribute('content', color);
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    return () => {
      if (meta && previousMeta) meta.content = previousMeta;
      document.documentElement.style.backgroundColor = previousHtml;
      document.body.style.backgroundColor = previousBody;
    };
  }, [color]);
  return null;
}
