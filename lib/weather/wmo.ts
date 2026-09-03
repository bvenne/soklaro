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
