import fs from 'node:fs';

const failures = [];
const requireUrl = (name, value, allowedHosts) => {
  if (!value) return failures.push(`${name} fehlt.`);
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') failures.push(`${name} muss HTTPS verwenden.`);
    if (/(^|\.)(example\.(com|org|net)|invalid|test|localhost)$/.test(url.hostname)) failures.push(`${name} ist noch ein Beispielwert.`);
    if (name === 'NEXT_PUBLIC_REPOSITORY_URL' && /^\/(example|your-account)\//.test(url.pathname)) failures.push(`${name} enthält noch ein Beispielkonto.`);
    if (allowedHosts && !allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) failures.push(`${name} verweist nicht auf einen unterstützten Repository-Host.`);
  } catch { failures.push(`${name} ist keine gültige URL.`); }
};

requireUrl('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL);
requireUrl('NEXT_PUBLIC_REPOSITORY_URL', process.env.NEXT_PUBLIC_REPOSITORY_URL, ['github.com', 'gitlab.com', 'codeberg.org']);

const mode = process.env.OPEN_METEO_USAGE_MODE;
if (!['non-commercial', 'commercial-proxy', 'self-hosted'].includes(mode)) failures.push('OPEN_METEO_USAGE_MODE ist nicht festgelegt.');
if (mode === 'commercial-proxy' && process.env.VITE_OPEN_METEO_URL === 'https://api.open-meteo.com') failures.push('Kommerzielle Builds dürfen nicht den öffentlichen Open-Meteo-Endpunkt verwenden.');

const imprint = fs.readFileSync('app/impressum/page.tsx', 'utf8');
if (/\[[^\]]*ergänzen[^\]]*\]/i.test(imprint) || /nicht veröffentlichungsfähig/i.test(imprint)) failures.push('Das Impressum enthält noch Platzhalter.');

for (const file of ['ASSET_LICENSE.md', 'public/legal/project-license.txt', 'public/legal/third-party-licenses.txt']) {
  if (!fs.existsSync(file)) failures.push(`${file} fehlt.`);
}

if (failures.length) {
  console.error(`Release blockiert:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Release-Konfiguration vollständig.');
