import type { Coordinates, Place } from './types';

type NominatimAddress = Partial<Record<
  'city' | 'town' | 'village' | 'municipality' | 'hamlet' | 'suburb' | 'county' | 'state' | 'country',
  string
>>;

type NominatimResult = {
  display_name?: string;
  address?: NominatimAddress;
};

export function placeNameFromNominatim(result: NominatimResult): Pick<Place, 'name' | 'admin' | 'country'> | null {
  const address = result.address ?? {};
  const name = address.city ?? address.town ?? address.village ?? address.municipality
    ?? address.hamlet ?? address.suburb ?? result.display_name?.split(',')[0]?.trim();
  if (!name) return null;
  const admin = [address.county, address.state].find((value) => value && value !== name);
  return { name, admin, country: address.country };
}

export async function reverseGeocode(coordinates: Coordinates, signal?: AbortSignal): Promise<Pick<Place, 'name' | 'admin' | 'country'> | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.search = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    zoom: '10',
    addressdetails: '1',
    'accept-language': 'de',
  }).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`Reverse geocoding failed with ${response.status}`);
  return placeNameFromNominatim(await response.json() as NominatimResult);
}
