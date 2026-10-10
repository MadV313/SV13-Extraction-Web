import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.ico':'image/x-icon' };

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\.\./g, '');
  let target = path.join(root, clean);
  if (clean.endsWith('/')) target = path.join(target, 'index.html');
  else if (!path.extname(target) && fs.existsSync(path.join(target, 'index.html'))) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) target = path.join(root, '404.html');
  return target;
}

const server = http.createServer((req,res) => {
  const file = resolveFile(req.url || '/');
  const is404 = path.basename(file) === '404.html' && !fs.existsSync(path.join(root, decodeURIComponent((req.url||'/').split('?')[0]).replace(/\.\./g,'')));
  res.writeHead(is404 ? 404 : 200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});
server.listen(8788, '127.0.0.1', () => console.log('SV13 preview: http://127.0.0.1:8788'));
