import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
describe('locale completeness', () => { it('keeps every locale aligned with German', () => { const directory = join(process.cwd(), 'lib/i18n/locales'); const reference = Object.keys(JSON.parse(readFileSync(join(directory, 'de.json'), 'utf8'))).sort(); const files = readdirSync(directory).filter((file) => file.endsWith('.json')); expect(files).toHaveLength(30); for (const file of files) expect(Object.keys(JSON.parse(readFileSync(join(directory, file), 'utf8'))).sort(), file).toEqual(reference); }); });
