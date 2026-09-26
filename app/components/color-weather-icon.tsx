import { interpretWmo } from '@/lib/weather/wmo';

/** Coloured symbols for the light theme; the existing monochrome set stays in the dark theme. */
export function ColorWeatherIcon({ code, isDay = true, sunShowers = false }: { code: number; isDay?: boolean; sunShowers?: boolean }) {
  const kind = interpretWmo(code).kind;
  const clear = kind === 'clear';
  const sunBehindCloud = sunShowers || kind === 'mostly-clear' || kind === 'partly-cloudy' || kind === 'showers';
  const hasSun = isDay && (clear || sunBehindCloud);
  const hasMoon = !isDay && (clear || sunBehindCloud);
  const hasCloud = !clear && kind !== 'fallback';
  const hasRain = sunShowers || ['drizzle', 'rain', 'showers', 'thunderstorm', 'freezing', 'extreme'].includes(kind);
  const hasSnow = kind === 'snow' || kind === 'snow-showers';
  const hasLightning = kind === 'thunderstorm' || kind === 'extreme';
  const fog = kind === 'fog';
  const cloudFill = ['overcast', 'thunderstorm', 'extreme'].includes(kind) ? '#8ba5b5' : '#d7e7ef';

  return <svg className="color-weather-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    {hasSun && <g transform={clear ? 'translate(9 10)' : undefined} stroke="#db8b17" strokeWidth="2.8" strokeLinecap="round">
      <path d="M23 5v4M23 33v4M7 21h4M35 21h4M11.5 9.5l3 3M31.5 29.5l3 3M34.5 9.5l-3 3M14.5 29.5l-3 3" />
      <circle cx="23" cy="21" r="9" fill="#ffca49" stroke="#e99c20" />
    </g>}
    {hasMoon && <path d="M29 7a17 17 0 1 0 16 25A17 17 0 0 1 29 7Z" fill="#7382c8" stroke="#5668a8" strokeWidth="2" strokeLinejoin="round" />}
    {hasCloud && <path d="M18 44h30a9 9 0 0 0 0-18h-2a13 13 0 0 0-24-3 10.5 10.5 0 0 0-4 21Z" fill={cloudFill} stroke="#718b9a" strokeWidth="2.2" strokeLinejoin="round" />}
    {fog && <g stroke="#7899a5" strokeWidth="2.5" strokeLinecap="round"><path d="M9 49h26M24 55h30" /></g>}
    {hasRain && !hasLightning && <g stroke="#2581b7" strokeWidth="3" strokeLinecap="round"><path d="M23 49l-2 6M35 49l-2 6M47 49l-2 6" /></g>}
    {hasSnow && <g fill="#2d95b4"><circle cx="23" cy="51" r="2.5" /><circle cx="35" cy="54" r="2.5" /><circle cx="47" cy="51" r="2.5" /></g>}
    {hasLightning && <path d="M36 45l-6 9h7l-3 7 12-13h-8l4-7" fill="#f4b837" stroke="#a7751f" strokeWidth="1.5" strokeLinejoin="round" />}
    {kind === 'fallback' && <circle cx="32" cy="32" r="22" fill="#d7e7ef" stroke="#718b9a" strokeWidth="2" />}
  </svg>;
}
