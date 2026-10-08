export const RADAR_URL = 'https://maps.dwd.de/geoserver/ows';
export const RADAR_LAYER = 'dwd:Niederschlagsradar';
export const RADAR_CAPABILITIES_URL =
  'https://maps.dwd.de/geoserver/dwd/Niederschlagsradar/ows';
export const RADAR_WINDOW = 2 * 3600000;
export type RadarFrame = { time: number; reference: number; forecast: boolean };

/** Use advertised observation times, never manufacture timestamps from the device clock. */
export function radarTimes(dimension: string, hours = 2): number[] {
  const times = dimension
    .split(',')
    .flatMap((value) => {
      if (!value.includes('/')) return [Date.parse(value.trim())];
      const [start, end, interval] = value.trim().split('/');
      const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(interval);
      const step = match
        ? (Number(match[1] || 0) * 3600 +
            Number(match[2] || 0) * 60 +
            Number(match[3] || 0)) *
          1000
        : 0;
      const last = Date.parse(end),
        first = Math.max(Date.parse(start), last - hours * 3600000);
      if (
        !step ||
        !Number.isFinite(first) ||
        !Number.isFinite(last) ||
        first > last
      )
        return [];
      const result: number[] = [];
      for (let time = last; time >= first && result.length < 121; time -= step)
        result.push(time);
      return result;
    })
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const latest = times.at(-1);
  return latest === undefined
    ? []
    : [...new Set(times)]
        .filter((time) => time >= latest - hours * 3600000)
        .slice(-121);
}

export function radarFrames(
  validTimes: number[],
  references: number[],
  now: number,
): RadarFrame[] {
  const latest = references.filter((time) => time <= now).at(-1);
  if (latest === undefined) return [];
  const observations = new Set(references);
  return validTimes
    .filter((time) => time >= now - RADAR_WINDOW && time <= now + RADAR_WINDOW)
    .filter((time) => time > latest || observations.has(time))
    .map((time) => ({
      time,
      reference: time > latest ? latest : time,
      forecast: time > latest,
    }));
}

export function nearestRadarFrame(
  frames: RadarFrame[],
  time: number,
): RadarFrame | undefined {
  const nearest = frames.reduce<RadarFrame | undefined>(
    (best, frame) =>
      !best || Math.abs(frame.time - time) < Math.abs(best.time - time)
        ? frame
        : best,
    undefined,
  );
  return nearest && Math.abs(nearest.time - time) <= 150000
    ? nearest
    : undefined;
}

let cachedDimensions: {
  times: number[];
  references: number[];
  expires: number;
} | null = null;

export async function loadRadarTimes(
  signal: AbortSignal,
  refresh = false,
): Promise<RadarFrame[]> {
  signal.throwIfAborted();
  if (!refresh && cachedDimensions && cachedDimensions.expires > Date.now()) {
    return radarFrames(
      cachedDimensions.times,
      cachedDimensions.references,
      Date.now(),
    );
  }
  // The layer-specific virtual service avoids downloading every DWD product.
  const response = await fetch(
    `${RADAR_CAPABILITIES_URL}?service=WMS&version=1.3.0&request=GetCapabilities`,
    { signal },
  );
  if (!response.ok) throw new Error('Radar unavailable');
  const document = new DOMParser().parseFromString(
    await response.text(),
    'text/xml',
  );
  const layer = Array.from(document.getElementsByTagName('Layer')).find(
    (layer) =>
      Array.from(layer.children).some(
        (child) =>
          child.localName === 'Name' &&
          child.textContent?.split(':').at(-1) ===
            RADAR_LAYER.split(':').at(-1),
      ),
  );
  const dimension = (name: string) =>
    layer &&
    Array.from(layer.children).find(
      (child) =>
        child.localName === 'Dimension' && child.getAttribute('name') === name,
    );
  const times = radarTimes(dimension('time')?.textContent || '', 6);
  const references = radarTimes(
    dimension('REFERENCE_TIME')?.textContent || '',
    6,
  );
  const frames = radarFrames(times, references, Date.now());
  if (!frames.length) throw new Error('No radar observations');
  signal.throwIfAborted();
  cachedDimensions = { times, references, expires: Date.now() + 60_000 };
  return frames;
}

export type RadarViewport = {
  west: number;
  south: number;
  east: number;
  north: number;
  width: number;
  height: number;
};

export function radarImageUrl(
  frame: RadarFrame,
  viewport: RadarViewport,
): string {
  // Radar pixels are kilometres wide; retina-sized screenshots add no detail.
  const scale = Math.min(1, 960 / Math.max(viewport.width, viewport.height));
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: RADAR_LAYER,
    styles: '',
    format: 'image/png',
    transparent: 'true',
    srs: 'EPSG:3857',
    bbox: [viewport.west, viewport.south, viewport.east, viewport.north]
      .map((value) => value.toFixed(2))
      .join(','),
    width: String(Math.max(1, Math.round(viewport.width * scale))),
    height: String(Math.max(1, Math.round(viewport.height * scale))),
    time: new Date(frame.time).toISOString(),
    dim_reference_time: new Date(frame.reference).toISOString(),
  });
  return `${RADAR_URL}?${params}`;
}

export function nextRadarFrame(
  frames: RadarFrame[],
  current: number,
): RadarFrame | undefined {
  return frames.find((frame) => frame.time > current) ?? frames[0];
}

export function radarPrefetchFrames(
  frames: RadarFrame[],
  current: RadarFrame,
): RadarFrame[] {
  const index = frames.findIndex((frame) => frame.time === current.time);
  if (index < 0) return [];
  return [1, 2, 3, -1]
    .map((offset) => frames[index + offset])
    .filter((frame): frame is RadarFrame => frame !== undefined);
}
