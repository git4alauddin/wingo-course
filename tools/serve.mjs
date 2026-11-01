import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
export function startServer(port = Number(process.env.PORT || 4173)) {
  const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = resolve(root, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
      const name = relative(root, target).split(sep).join('/');
      if (!(name === 'index.html' || /^(css|js|assets)\//.test(name)) || name.split(/[\\/]/).some(part => part.startsWith('.')) || !target.startsWith(root + sep)) {
        response.writeHead(404).end('Not found');
        return;
      }
      const data = name === 'index.html' ? Buffer.from(await renderPage(), 'utf8') : await readFile(target);
      response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (!(error.code === 'ENOENT' || error instanceof URIError)) {
        console.error(error.message);
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Page configuration could not be loaded. Check the server terminal.');
        return;
      }
      response.writeHead(404).end('Not found');
    }
  });
  return new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolveReady(server));
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startServer();
  console.log(`WinGo Course: http://127.0.0.1:${server.address().port}/`);
}
