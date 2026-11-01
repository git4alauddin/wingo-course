import { mkdir, cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'assets']) {
  await cp(resolve(root, entry), resolve(root, 'dist', entry), { recursive: true });
}
console.log('Static site built in dist/');
