import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
const outputPath = path.resolve(projectRoot, outputArgument ?? 'public/legal/third-party-licenses.txt');
const checkOnly = process.argv.includes('--check');
const lock = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8'));
const packages = new Map();

for (const [location, lockEntry] of Object.entries(lock.packages ?? {})) {
  if (!location || lockEntry.dev || lockEntry.optional || !location.includes('node_modules/')) continue;
  const packageDir = path.join(projectRoot, location);
  const manifestPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Fehlendes installiertes Paket für Lizenzbericht: ${location}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const key = `${manifest.name}@${manifest.version}`;
  if (packages.has(key)) continue;
  const licenseFiles = fs.readdirSync(packageDir)
    .filter((name) => /^(licen[cs]e|copying|notice)(\..*)?$/i.test(name))
    .sort();
  if (!manifest.license) throw new Error(`Fehlende Lizenzangabe für ${key}`);
  packages.set(key, { manifest, packageDir, licenseFiles });
}

const sections = [...packages.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => {
  const repository = typeof item.manifest.repository === 'string'
    ? item.manifest.repository
    : item.manifest.repository?.url;
  const origin = item.manifest.homepage ?? repository ?? 'nicht angegeben';
  const texts = item.licenseFiles.map((name) => {
    const text = fs.readFileSync(path.join(item.packageDir, name), 'utf8').trim();
    return `--- ${name} ---\n${text}`;
  }).join('\n\n') || `Das veröffentlichte npm-Paket enthält keine separate Lizenzdatei.\nDeklarierte SPDX-Lizenz: ${item.manifest.license}\nLizenztext und Copyright-Hinweise sind über die oben angegebene Paketquelle zu prüfen.`;
  return `${'='.repeat(78)}\n${key}\nLizenz: ${item.manifest.license}\nQuelle: ${origin}\n${'='.repeat(78)}\n\n${texts}`;
});

const report = [
  'SOKLARO – LIZENZEN DER PRODUKTIONSABHÄNGIGKEITEN',
  '',
  'Automatisch aus package-lock.json und den installierten Paketen erzeugt.',
  `Enthaltene eindeutige Pakete: ${sections.length}`,
  '',
  ...sections,
  '',
].join('\n');

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== report) {
    throw new Error('Der Drittanbieter-Lizenzbericht ist nicht aktuell. Führe npm run licenses:generate aus.');
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report);
}
