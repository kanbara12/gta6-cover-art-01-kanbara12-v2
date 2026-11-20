// serve.ts — local static server for Crimson Palms Cover Press v2 (Node 22)
// Serves the entry directory so the app can be opened in a desktop browser.
// Usage: node serve.ts [port]   (default 8123)
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const port = parseInt(process.argv[2] || '8123', 10);

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = urlPath === '/' ? path.join(root, 'app', 'index.html') : path.join(root, urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log('serving ' + root + ' at http://127.0.0.1:' + port + '/');
});
