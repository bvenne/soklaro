import type { NextConfig } from 'next';

const connectionOrigins = new Set([
  "'self'",
  'https://api.open-meteo.com',
  'https://geocoding-api.open-meteo.com',
  'https://nominatim.openstreetmap.org',
]);

for (const value of [process.env.VITE_OPEN_METEO_URL, process.env.VITE_OPEN_METEO_GEOCODING_URL]) {
  if (!value) continue;
  try { connectionOrigins.add(new URL(value).origin); } catch { /* Release validation reports malformed URLs. */ }
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: `default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src ${[...connectionOrigins].join(' ')}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];
const nextConfig: NextConfig = { async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; } };

export default nextConfig;
