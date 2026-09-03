import type { Place, WeatherForecast, WeatherPoint } from './types';

export const berlin: Place = { id: '2950159', name: 'Berlin', country: 'Deutschland', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' };

export function mockForecast(place: Place = berlin): WeatherForecast {
  const start = new Date('2026-09-01T12:00:00Z');
  const hourly: WeatherPoint[] = Array.from({ length: 48 }, (_, index) => {
    const time = new Date(start.getTime() + index * 3_600_000);
    const hour = time.getHours();
    const temperature = 19 + Math.sin(((hour - 7) / 24) * Math.PI * 2) * 5;
    return {
      time: time.toISOString().slice(0, 16), temperature, apparentTemperature: temperature - 0.8,
      weatherCode: index < 4 ? 2 : index < 9 ? 61 : 3, isDay: hour >= 6 && hour < 20,
      precipitation: index >= 4 && index < 9 ? 0.7 : 0, precipitationProbability: index >= 4 && index < 9 ? 72 : 18,
      humidity: 64, dewPoint: 12, cloudCover: index < 4 ? 38 : 72, windSpeed: 14, windDirection: 236,
      windGusts: index > 7 ? 35 : 27, pressure: 1014, visibility: 24_000, uvIndex: hour > 10 && hour < 17 ? 4.3 : 0,
    };
  });
  return {
    place, timezone: place.timezone ?? 'Europe/Berlin', timezoneAbbreviation: 'CEST', updatedAt: start.toISOString(),
    current: hourly[0], hourly,
    daily: Array.from({ length: 14 }, (_, index) => ({
      date: new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10),
      weatherCode: [2, 61, 3, 1, 80, 2, 0][index % 7], temperatureMax: 23 - index * 0.2,
      temperatureMin: 13 - index * 0.1, precipitationProbability: [20, 70, 35, 10, 55, 25, 5][index % 7],
      precipitationSum: [0, 4.8, 0.4, 0, 2.6, 0.2, 0][index % 7], sunshineDuration: [25200, 10800, 14400, 32400, 12600, 23400, 36000][index % 7],
      sunrise: `2026-09-${String(index + 1).padStart(2, '0')}T06:18`, sunset: `2026-09-${String(index + 1).padStart(2, '0')}T19:48`,
    })), source: 'mock',
  };
}
