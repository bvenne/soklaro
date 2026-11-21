import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer, loadEnv } from 'vite';

const out = 'dist/web';
const env = loadEnv('production', process.cwd(), '');
const base = env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
const template = await readFile(join(out, 'index.html'), 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const routes = [
  ['/', '/app/page.tsx', 'soklaro – Wetter ohne Tracking', 'Das Wetter für deinen Ort – nicht dein Standort für Werbenetzwerke.'],
  ['/app', null, 'Dein Wetter · soklaro', 'Wetter, Regenradar und 14-Tage-Ausblick für deinen Ort.'],
  ['/privacy', '/app/privacy/content.tsx', 'Netzwerk & Datenschutz · soklaro', 'Alle Netzwerkverbindungen und lokalen Daten von soklaro.'],
  ['/impressum', '/app/impressum/content.tsx', 'Impressum · soklaro', 'Anbieter- und Kontaktangaben für soklaro.'],
];
const sources = new Set(["'self'", 'https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com',
  'https://nominatim.openstreetmap.org', 'https://maps.dwd.de', 'https://commons.wikimedia.org']);
for (const url of [env.VITE_OPEN_METEO_URL, env.VITE_OPEN_METEO_GEOCODING_URL]) if (url) sources.add(new URL(url).origin);
const policy = `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://maps.dwd.de https://tile.openstreetmap.org https://thumb.wikimedia.org https://upload.wikimedia.org; connect-src ${[...sources].join(' ')}; object-src 'none'; base-uri 'self'; form-action 'self'`;
const renderer = await createServer({ mode: 'production', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  for (const [route, module, title, description] of routes) {
    const content = module ? renderToString(createElement((await renderer.ssrLoadModule(module)).default)) : '';
    const head = `<title>${route === '/' || route === '/app' ? 'soklaro' : escape(title)}</title>
      <meta name="description" content="${escape(description)}">
      ${base ? `<link rel="canonical" href="${escape(base + route)}">` : ''}
      <meta property="og:type" content="website">
      <meta property="og:title" content="${escape(title)}">
      <meta property="og:description" content="${escape(description)}">
      <meta property="og:image" content="${base ? escape(base) + '/' : './'}og.png">`;
    const html = template.replace('<html lang="de">', `<html lang="de" data-page="${route}">`).replace('<base href="/">', `<base href="${route === '/' ? './' : '../'}">`).replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${escape(policy)}"><meta name="referrer" content="strict-origin-when-cross-origin">`)
      .replace(/<title>.*?<\/title>/, () => head).replace('<div id="root"></div>', () => `<div id="root">${content}</div>`);
    const file = join(out, route, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
} finally { await renderer.close(); }
await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
if (base) await writeFile(join(out, 'sitemap.xml'), `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(([p]) => `<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);

// Only the app shell and two fallback images are installed for offline use.
const files = [...routes.map(([p]) => (p === '/' ? '' : p) + '/index.html'), '/manifest.webmanifest', '/apple-touch-icon.png',
  '/weather/fallback-day-640.webp', '/weather/fallback-night-640.webp'];
for (const dir of ['assets','fonts','icons']) {
  for (const name of await readdir(join(out, dir))) files.push('/' + dir + '/' + name);
}
const worker = await readFile('tools/sw-template.js', 'utf8');
const hash = createHash('sha256').update(worker);
for (const file of files.sort()) hash.update(file).update(await readFile(join(out, file)));
await writeFile(join(out, 'sw.js'), worker.replace('__VERSION__', hash.digest('hex').slice(0,16)).replace('__FILES__', JSON.stringify(files)));
