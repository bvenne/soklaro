import fs from 'node:fs';

fs.mkdirSync('public/legal', { recursive: true });
fs.copyFileSync('LICENSE', 'public/legal/project-license.txt');
fs.copyFileSync('SECURITY.md', 'public/legal/security.txt');
