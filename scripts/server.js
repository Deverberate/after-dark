const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});

  let reqPath = decodeURI((req.url || '/').split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const rootDir = path.resolve(__dirname, '..');
  const filePath = path.join(rootDir, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
    });
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.end());
    stream.pipe(res);
  });
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
