import { mkdir, writeFile } from 'node:fs/promises';

const files = [
  ['https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4QK1O4a0Ew.woff2', 'outfit-500-latin.woff2'],
  ['https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt', 'OFL-Outfit.txt'],
];
const directory = new URL('../public/fonts/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [source, name] of files) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not fetch ${source}: ${response.status}`);
  await writeFile(new URL(name, directory), Buffer.from(await response.arrayBuffer()));
}
