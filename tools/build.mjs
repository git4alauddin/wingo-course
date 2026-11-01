import { mkdir, cp, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './render.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = await renderPage();
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), page, 'utf8');
for (const entry of ['css', 'js', 'assets']) {
  await cp(resolve(root, entry), resolve(root, 'dist', entry), { recursive: true });
}
console.log('Static site built in dist/');
