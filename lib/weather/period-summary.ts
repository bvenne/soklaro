import type { WeatherPoint } from './types';
import { hourSummary } from './hour-summary';
import { interpretWmo } from './wmo';

const periods = [
  { name: 'Morning', start: 6, end: 12, range: '06–12 Uhr' },
  { name: 'Noon', start: 12, end: 18, range: '12–18 Uhr' },
  { name: 'Evening', start: 18, end: 24, range: '18–24 Uhr' },
  { name: 'Night', start: 24, end: 30, range: '00–06 Uhr · Folgetag' },
];

export function periodSummaries(date: string, hourly: WeatherPoint[]) {
  const midnight = Date.parse(`${date}T00:00:00Z`);
  return periods.map(period => {
    const start = new Date(midnight + period.start * 3600000).toISOString().slice(0, 16);
    const end = new Date(midnight + period.end * 3600000).toISOString().slice(0, 16);
    const hours = hourly.filter(hour => hour.time >= start && hour.time < end);
    const complete = hours.length === 6;
    const metric = (key: 'temperature' | 'precipitation' | 'precipitationProbability' | 'windSpeed', aggregate: (values: number[]) => number) =>
      complete && hours.every(hour => Number.isFinite(hour[key])) ? aggregate(hours.map(hour => hour[key])) : null;
    const isDay = hours.filter(hour => hour.isDay).length > hours.length / 2;
    const summaries = hours.map(hour => ({ ...hourSummary(hour), isDay: hour.isDay }));
    const hazards = summaries.filter(s => ['thunderstorm', 'extreme', 'freezing', 'snow', 'snow-showers'].includes(interpretWmo(s.code).kind));
    const candidates = hazards.length ? hazards : summaries.filter(s => s.isDay === isDay);
    // Most frequent sunshine-adjusted condition; hazardous weather remains visible.
    const counts = new Map<number, number>();
    for (const s of candidates) counts.set(s.code, (counts.get(s.code) ?? 0) + 1);
    const representative = [...candidates].sort((a, b) => (counts.get(b.code)! - counts.get(a.code)!))[0];
    const wet = hours.some(h => ['rain', 'showers', 'drizzle'].includes(interpretWmo(h.weatherCode).kind));
    const wetRepresentative = representative && ['rain', 'showers', 'drizzle'].includes(interpretWmo(representative.code).kind);
    const label = representative ? representative.label + (wet && !wetRepresentative && !hazards.length ? ' · zeitweise Regen möglich' : '') : 'Keine Detaildaten';
    return { ...period, complete, isDay, code: complete ? representative?.code ?? -1 : -1,
      label: complete ? label : 'Keine vollständigen Detaildaten',
      temperatureMin: metric('temperature', values => Math.min(...values)),
      temperatureMax: metric('temperature', values => Math.max(...values)),
      precipitationProbability: metric('precipitationProbability', values => Math.max(...values)),
      precipitation: metric('precipitation', values => values.reduce((sum, value) => sum + value, 0)),
      windSpeed: metric('windSpeed', values => values.reduce((sum, value) => sum + value, 0) / values.length),
    };
  });
}
