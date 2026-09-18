import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/icons/soklaro.svg', import.meta.url), 'utf8');
const output = (name) => new URL('../public/icons/' + name, import.meta.url).pathname;
for (const size of [192, 512]) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(output('soklaro-' + size + '.png'));
}
const appleIcon = sharp(Buffer.from(source.replace('rx="16"', 'rx="0"'))).resize(180, 180).png();
await appleIcon.clone().toFile(output('apple-touch-icon.png'));
await appleIcon.clone().toFile(new URL('../public/apple-touch-icon.png', import.meta.url).pathname);
const inner = source.slice(source.indexOf('>') + 1, source.lastIndexOf('</svg>'));
const maskable = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#123D42"/><g transform="translate(8 8) scale(.75)">' + inner + '</g></svg>';
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(output('soklaro-maskable-512.png'));
