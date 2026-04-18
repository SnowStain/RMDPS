const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT_DIR = path.resolve(__dirname, '.');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const requestPath = String((req.url || '/').split('?')[0] || '/');
  let decodedPath = '/';
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch (error) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const relativePath = decodedPath === '/'
    ? 'pages/ARTINX-Laboratory/ARTINX-Laboratory.html'
    : decodedPath.replace(/^[/\\]+/, '');
  const normalizedPath = path.normalize(relativePath);
  if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let filePath = path.join(ROOT_DIR, normalizedPath);
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});