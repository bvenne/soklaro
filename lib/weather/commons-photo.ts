import type { Place } from './types';
import type { WeatherKind } from './wmo';

export type WeatherPhoto = {
  url: string;
  sourceUrl: string;
  artist: string;
  license: string;
  licenseUrl: string;
};

type MetadataValue = { value?: string };
type CommonsPage = {
  title?: string;
  index?: number;
  imageinfo?: Array<{
    width?: number;
    height?: number;
    mime?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, MetadataValue>;
  }>;
};

const terms: Record<WeatherKind, [german: string, english: string, matches: string[]]> = {
  clear: ['Sonne', 'sunny', ['sonne', 'sonnig', 'sunny', 'sunshine']],
  'mostly-clear': ['Sonne', 'sunny', ['sonne', 'sonnig', 'sunny', 'sunshine']],
  'partly-cloudy': ['Wolken', 'cloudy', ['wolken', 'cloud', 'bewolkt']],
  overcast: ['Wolken', 'cloudy', ['wolken', 'cloud', 'bewolkt']],
  fog: ['Nebel', 'fog', ['nebel', 'fog', 'mist']],
  drizzle: ['Regen', 'rain', ['regen', 'rain']],
  rain: ['Regen', 'rain', ['regen', 'rain']],
  showers: ['Regen', 'rain', ['regen', 'rain']],
  thunderstorm: ['Gewitter', 'thunderstorm', ['gewitter', 'thunderstorm', 'lightning']],
  snow: ['Schnee', 'snow', ['schnee', 'snow']],
  'snow-showers': ['Schnee', 'snow', ['schnee', 'snow']],
  freezing: ['Schnee', 'snow', ['schnee', 'snow', 'eis', 'ice']],
  extreme: ['Gewitter', 'thunderstorm', ['gewitter', 'thunderstorm', 'lightning']],
  fallback: ['', '', []],
};

function normalized(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function plainText(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim().slice(0, 120) ?? '';
}

function distanceKm(place: Place, latitude: number, longitude: number): number {
  const toRadians = Math.PI / 180;
  const latDifference = (latitude - place.latitude) * toRadians;
  const lonDifference = (longitude - place.longitude) * toRadians;
  const arc = Math.sin(latDifference / 2) ** 2
    + Math.cos(place.latitude * toRadians) * Math.cos(latitude * toRadians) * Math.sin(lonDifference / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(arc)));
}

export function weatherPhotoKey(place: Place, kind: WeatherKind, isDay: boolean): string {
  return `${place.id}:${normalized(place.name)}:${kind}:${isDay ? 'day' : 'night'}`;
}

export async function findCommonsWeatherPhoto(place: Place, kind: WeatherKind, isDay: boolean, signal: AbortSignal): Promise<WeatherPhoto | null> {
  const city = place.name.trim().replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 60);
  if (city.length < 2 || /^(aktueller ort|dein standort|your location)$/i.test(city) || kind === 'fallback') return null;

  const [german, english, matchingTerms] = terms[kind];
  const germanSpeaking = /^(deutschland|germany|österreich|austria|schweiz|switzerland)$/i.test(place.country ?? '');
  const searchTerm = germanSpeaking ? german : english;
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${city} ${searchTerm}${isDay ? '' : ' Nacht night'} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|GPSLatitude|GPSLongitude',
    iiurlwidth: String(window.innerWidth < 800 ? 800 : 1440), format: 'json', formatversion: '2', origin: '*',
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error(`Commons search failed: ${response.status}`);
  const data = await response.json() as { query?: { pages?: CommonsPage[] } };
  const cityName = normalized(city);
  const candidates = (data.query?.pages ?? []).flatMap((page) => {
    const info = page.imageinfo?.[0];
    const title = normalized(page.title ?? '');
    const ratio = (info?.width ?? 0) / (info?.height ?? 1);
    const license = info?.extmetadata?.LicenseShortName?.value ?? '';
    const licenseUrl = info?.extmetadata?.LicenseUrl?.value ?? '';
    const artist = plainText(info?.extmetadata?.Artist?.value ?? '');
    const url = info?.thumburl ?? '';
    const sourceUrl = info?.descriptionurl ?? '';
    const latitude = Number(info?.extmetadata?.GPSLatitude?.value);
    const longitude = Number(info?.extmetadata?.GPSLongitude?.value);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;
    if (!title.includes(cityName) || !matchingTerms.some((term) => title.includes(term))) return [];
    if (!isDay && !/nacht|night|evening|abend/.test(title)) return [];
    if (/schiff|ship|skulptur|sculpture|gemalde|painting|poster|kunsthalle|museum|film|mural|aquarium|cafe|restaurant/.test(title)) return [];
    if (hasCoordinates && distanceKm(place, latitude, longitude) > 80) return [];
    if (ratio < 1.2 || ratio > 3.2 || (info?.width ?? 0) < 1000 || info?.mime !== 'image/jpeg') return [];
    if (!/^(CC BY(?:-SA)?\s|CC0|Public domain)/i.test(license) || !artist) return [];
    if (!/^https:\/\/(thumb|upload)\.wikimedia\.org\//.test(url)
      || !sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:')
      || !/^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(licenseUrl)) return [];
    const score = (hasCoordinates ? 3 : 0) + (ratio >= 1.45 && ratio <= 2.4 ? 2 : 0)
      - (/nach regen|after rain|before rain|vor dem regen/.test(title) ? 2 : 0) - (page.index ?? 20) / 20;
    return [{ photo: { url, sourceUrl, artist, license, licenseUrl }, score }];
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.photo ?? null;
}
