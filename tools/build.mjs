import { mkdir, cp, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './render.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = await renderPage();
if (/\{\{[\w.]+\}\}/.test(page)) throw new Error('Build contains unresolved configuration placeholders.');
// Keep the root entry point usable by ordinary static previews as well as Pages.
await writeFile(resolve(root, 'index.html'), page, 'utf8');
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), page, 'utf8');
for (const entry of ['css', 'js', 'assets']) {
  await cp(resolve(root, entry), resolve(root, 'dist', entry), { recursive: true });
}
console.log('Configured static site built in dist/ and root index.html refreshed.');
