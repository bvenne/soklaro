import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { knownWmoCodes } from '@/lib/weather/wmo';
import { ColorWeatherIcon } from './color-weather-icon';

const renderIcon = (code: number, isDay = true, sunShowers = false) =>
  renderToStaticMarkup(createElement(ColorWeatherIcon, { code, isDay, sunShowers }));

it('renders every supported WMO code and separates the common weather conditions', () => {
  for (const code of knownWmoCodes) {
    expect(renderIcon(code)).toContain('<path');
  }
  // Clear, mostly clear, partly cloudy, overcast, fog, freezing fog, drizzle,
  // freezing rain, rain, snow, snow grains, rain showers, snow showers, storms and hail.
  const representativeCodes = [0, 1, 2, 3, 45, 48, 51, 66, 63, 73, 77, 81, 85, 95, 96];
  const symbols = representativeCodes.map(code => renderIcon(code));
  expect(new Set(symbols).size).toBe(representativeCodes.length);
  expect(symbols).not.toContain(renderIcon(-1));
});

it('shows a moon at night and adds sunshine to showers when the forecast indicates it', () => {
  expect(renderIcon(0, false)).not.toBe(renderIcon(0));
  expect(renderIcon(2, false)).not.toBe(renderIcon(2));
  expect(renderIcon(80, true, true)).not.toBe(renderIcon(80));
});

it('draws white snow in flakes, grains and showers', () => {
  for (const code of [71, 73, 75, 85, 86]) {
    expect(renderIcon(code)).toContain('stroke="#fff"');
  }
  expect(renderIcon(77)).toContain('fill="#fff"');
});
