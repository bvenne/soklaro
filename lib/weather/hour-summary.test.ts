import { expect, it } from 'vitest';
import { hourSummary } from './hour-summary';
import { mockForecast } from './mock';
const hour = { ...mockForecast().hourly[0], weatherCode: 3, isDay: true, cloudCover: 98, sunshineDuration: 3600 };
it('shows sunshine through thick cloud for the Berlin example', () => {
  expect(hourSummary(hour)).toEqual({ code: 2, label: 'Sonne und Wolken' });
  expect(hourSummary({ ...hour, sunshineDuration: 943 })).toEqual({ code: 2, label: 'Sonne und Wolken' });
});
it('reserves the sun-only icon for long sunshine and little cloud', () => {
  expect(hourSummary({ ...hour, cloudCover: 10 }).code).toBe(0);
  expect(hourSummary({ ...hour, cloudCover: 40 }).code).toBe(1);
});
it('preserves night, missing data, short sunshine and hazardous weather', () => {
  for (const value of [{ isDay: false }, { sunshineDuration: undefined }, { sunshineDuration: 60 }]) {
    expect(hourSummary({ ...hour, ...value }).code).toBe(3);
  }
  for (const weatherCode of [45, 61, 71, 66, 95, 99]) {
    expect(hourSummary({ ...hour, weatherCode }).code).toBe(weatherCode);
  }
});
