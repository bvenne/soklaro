export type WeatherKind =
  | 'clear' | 'mostly-clear' | 'partly-cloudy' | 'overcast' | 'fog'
  | 'drizzle' | 'rain' | 'showers' | 'thunderstorm' | 'snow'
  | 'snow-showers' | 'freezing' | 'extreme' | 'fallback';

export type WeatherCondition = {
  kind: WeatherKind;
  label: string;
  severity: 'normal' | 'moderate' | 'severe';
};

const conditions: Record<number, WeatherCondition> = {
  0: { kind: 'clear', label: 'Klar', severity: 'normal' },
  1: { kind: 'mostly-clear', label: 'Überwiegend klar', severity: 'normal' },
  2: { kind: 'partly-cloudy', label: 'Teilweise bewölkt', severity: 'normal' },
  3: { kind: 'overcast', label: 'Bedeckt', severity: 'normal' },
  45: { kind: 'fog', label: 'Nebel', severity: 'moderate' },
  48: { kind: 'fog', label: 'Reifnebel', severity: 'moderate' },
  51: { kind: 'drizzle', label: 'Leichter Nieselregen', severity: 'normal' },
  53: { kind: 'drizzle', label: 'Nieselregen', severity: 'normal' },
  55: { kind: 'drizzle', label: 'Starker Nieselregen', severity: 'moderate' },
  56: { kind: 'freezing', label: 'Leichter gefrierender Nieselregen', severity: 'moderate' },
  57: { kind: 'freezing', label: 'Gefrierender Nieselregen', severity: 'severe' },
  61: { kind: 'rain', label: 'Leichter Regen', severity: 'normal' },
  63: { kind: 'rain', label: 'Regen', severity: 'normal' },
  65: { kind: 'rain', label: 'Starker Regen', severity: 'moderate' },
  66: { kind: 'freezing', label: 'Leichter gefrierender Regen', severity: 'moderate' },
  67: { kind: 'freezing', label: 'Gefrierender Regen', severity: 'severe' },
  71: { kind: 'snow', label: 'Leichter Schneefall', severity: 'normal' },
  73: { kind: 'snow', label: 'Schneefall', severity: 'normal' },
  75: { kind: 'snow', label: 'Starker Schneefall', severity: 'moderate' },
  77: { kind: 'snow', label: 'Schneegriesel', severity: 'normal' },
  80: { kind: 'showers', label: 'Leichte Regenschauer', severity: 'normal' },
  81: { kind: 'showers', label: 'Regenschauer', severity: 'normal' },
  82: { kind: 'showers', label: 'Starke Regenschauer', severity: 'severe' },
  85: { kind: 'snow-showers', label: 'Leichte Schneeschauer', severity: 'normal' },
  86: { kind: 'snow-showers', label: 'Starke Schneeschauer', severity: 'moderate' },
  95: { kind: 'thunderstorm', label: 'Gewitter', severity: 'severe' },
  96: { kind: 'extreme', label: 'Gewitter mit leichtem Hagel', severity: 'severe' },
  99: { kind: 'extreme', label: 'Gewitter mit starkem Hagel', severity: 'severe' },
};

export const knownWmoCodes = Object.keys(conditions).map(Number);

export function interpretWmo(code: number): WeatherCondition {
  return conditions[code] ?? { kind: 'fallback', label: 'Unbekannte Wetterlage', severity: 'moderate' };
}

export function backgroundFor(code: number, isDay: boolean): string {
  const { kind } = interpretWmo(code);
  return `/weather/${kind}-${isDay ? 'day' : 'night'}-1280.webp`;
}

const statusBarColors: Record<WeatherKind, [day: string, night: string]> = {
  clear: ['#4a5661', '#121b24'],
  'mostly-clear': ['#424c55', '#111921'],
  'partly-cloudy': ['#3c444d', '#11171e'],
  overcast: ['#2f3438', '#111519'],
  fog: ['#54585b', '#2c3032'],
  drizzle: ['#2e353a', '#10151a'],
  rain: ['#22292f', '#0c1117'],
  showers: ['#242d34', '#0b1219'],
  thunderstorm: ['#14191f', '#070b10'],
  snow: ['#595d61', '#2f3235'],
  'snow-showers': ['#4d5357', '#272c2f'],
  freezing: ['#3a4248', '#181e24'],
  extreme: ['#17171e', '#0a0a10'],
  fallback: ['#33373a', '#131619'],
};

/** Matches Safari's top UI to the darkened upper edge of the active backdrop. */
export function statusBarColorFor(code: number, isDay: boolean): string {
  const colors = statusBarColors[interpretWmo(code).kind];
  return colors[isDay ? 0 : 1];
}
