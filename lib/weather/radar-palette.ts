/** DWD interval order and labels, with a sequential blue presentation.
 * Source: maps.dwd.de/geoserver/ows?service=WMS&version=1.1.1&request=GetStyles&layers=dwd:Niederschlagsradar
 * These are display colours, not new precipitation measurements.
 */
export const RADAR_RAIN_PALETTE = [
  { source: '#33ffff', color: '#c1e7ff', label: '0.1–0.2' },
  { source: '#1acc9a', color: '#a8daff', label: '0.2–0.4' },
  { source: '#019934', color: '#8cccff', label: '0.4–1' },
  { source: '#4db31b', color: '#70bbfc', label: '1–2' },
  { source: '#99cc01', color: '#51a6f4', label: '2–3' },
  { source: '#cce601', color: '#3692e8', label: '3–5' },
  { source: '#ffff01', color: '#237eda', label: '5–7.5' },
  { source: '#ffc401', color: '#166bc8', label: '7.5–10' },
  { source: '#ff8901', color: '#0d59b5', label: '10–15' },
  { source: '#ff4501', color: '#074aa0', label: '15–30' },
  { source: '#fe0000', color: '#063c8a', label: '30–45' },
  { source: '#e5004c', color: '#073174', label: '45–75' },
  { source: '#cc0098', color: '#08285f', label: '75–100' },
  { source: '#6600cb', color: '#071f4b', label: '100–150' },
  { source: '#0000fe', color: '#061739', label: '≥150' },
] as const;

type RGB = readonly [number, number, number];
const rgb = (hex: string): RGB => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];
const key = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;
const mappings = [
  ...RADAR_RAIN_PALETTE.map((entry) => ({
    source: rgb(entry.source),
    target: rgb(entry.color),
  })),
  // The provider's magenta coverage contour is not a rain-intensity class.
  { source: rgb('#fb00ff'), target: rgb('#7d7d7d') },
];
const lookup = new Map<number, RGB>(
  mappings.map(({ source, target }) => [key(...source), target]),
);

/** Recolour only the transparent radar overlay, preserving every pixel's alpha. */
export function recolorRadarPixels(pixels: Uint8ClampedArray): void {
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;
    const r = pixels[index],
      g = pixels[index + 1],
      b = pixels[index + 2];
    // Neutral pixels represent missing data, not rainfall. Leave them neutral.
    if (Math.max(r, g, b) - Math.min(r, g, b) <= 8) continue;
    const sourceKey = key(r, g, b);
    let target = lookup.get(sourceKey);
    if (!target) {
      // Antialiasing and unpremultiplication can slightly alter source colours.
      let distance = Infinity;
      for (const mapping of mappings) {
        const [sr, sg, sb] = mapping.source;
        const candidate = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2;
        if (candidate < distance) {
          distance = candidate;
          target = mapping.target;
        }
      }
      if (target && lookup.size < 2048) lookup.set(sourceKey, target);
    }
    if (!target) continue;
    pixels[index] = target[0];
    pixels[index + 1] = target[1];
    pixels[index + 2] = target[2];
  }
}

export async function blueRadarBlob(
  image: HTMLImageElement,
  signal: AbortSignal,
): Promise<Blob> {
  signal.throwIfAborted();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Radar colour rendering unavailable');
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    recolorRadarPixels(frame.data);
    context.putImageData(frame, 0, 0);
    signal.throwIfAborted();
    const result = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('Radar image encoding failed')),
        'image/png',
      );
    });
    signal.throwIfAborted();
    return result;
  } finally {
    // Release the intermediate canvas buffers; only the final image is cached.
    canvas.width = 0;
    canvas.height = 0;
  }
}
