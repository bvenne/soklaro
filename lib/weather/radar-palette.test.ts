import { expect, it } from 'vitest';
import { RADAR_RAIN_PALETTE, recolorRadarPixels } from './radar-palette';

const rgba = (hex: string, alpha = 255) =>
  new Uint8ClampedArray([...Buffer.from(hex.slice(1), 'hex'), alpha]);

it.each(RADAR_RAIN_PALETTE)(
  'maps DWD rain colour $source to blue $color without changing opacity',
  ({ source, color }) => {
    const pixels = rgba(source, 192);
    recolorRadarPixels(pixels);
    expect(pixels).toEqual(rgba(color, 192));
    expect(pixels[2]).toBeGreaterThan(pixels[0]);
    expect(pixels[2]).toBeGreaterThan(pixels[1]);
  },
);

it('uses progressively darker blues as rainfall intensity increases', () => {
  const brightness = RADAR_RAIN_PALETTE.map((entry) => {
    const [r, g, b] = rgba(entry.color);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  });
  for (let i = 1; i < brightness.length; i++)
    expect(brightness[i]).toBeLessThan(brightness[i - 1]);
});

it('keeps transparent dry pixels and grey missing-data pixels unchanged', () => {
  const pixels = new Uint8ClampedArray([
    ...rgba('#ffffff', 0),
    ...rgba('#7d7d7d', 77),
    ...rgba('#000000', 0),
  ]);
  const before = pixels.slice();
  recolorRadarPixels(pixels);
  expect(pixels).toEqual(before);
});

it('does not turn the provider coverage contour into extreme rainfall', () => {
  const pixels = rgba('#fb00ff', 127);
  recolorRadarPixels(pixels);
  expect(pixels).toEqual(rgba('#7d7d7d', 127));
});

it('handles small decoding differences without leaving green or yellow rain pixels', () => {
  const pixels = new Uint8ClampedArray([2, 152, 52, 254, 255, 254, 2, 254]);
  recolorRadarPixels(pixels);
  expect(pixels.slice(0, 4)).toEqual(rgba('#8cccff', 254));
  expect(pixels.slice(4)).toEqual(rgba('#237eda', 254));
});
