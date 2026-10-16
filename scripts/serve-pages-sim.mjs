// Local static server that reproduces the GitHub Pages behavior this project relies on.
//
// - Serves dist/ under the base path (default /morts-portfolio/).
// - Existing file: 200. Directory with index.html: 200 (a missing trailing slash redirects, 301).
// - Anything else under the base path: dist/404.html with HTTP status 404, exactly like Pages.
// - Anything outside the base path: plain 404.
//
// This approximates Pages for routing tests. It is NOT proof that the deployed site works.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

export function createPagesSimServer({ distDir, base = '/morts-portfolio/' }) {
  const root = resolve(distDir);
  const baseWithoutSlash = base.endsWith('/') ? base.slice(0, -1) : base;

  function respond(req, res, status, headers, body) {
    res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  function plain(req, res, status, message) {
    respond(req, res, status, { 'Content-Type': 'text/plain; charset=utf-8' }, message);
  }

  async function sendFile(req, res, status, filePath) {
    const body = await readFile(filePath);
    respond(
      req,
      res,
      status,
      {
        'Content-Type':
          CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': body.length,
      },
      body,
    );
  }

  async function notFound(req, res) {
    try {
      await sendFile(req, res, 404, join(root, '404.html'));
    } catch {
      plain(req, res, 404, 'Not Found (no 404.html in the build output)');
    }
  }

  async function handle(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return respond(req, res, 405, { Allow: 'GET, HEAD' }, '');
    }

    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return plain(req, res, 400, 'Bad Request');
    }

    if (pathname === baseWithoutSlash) {
      return respond(req, res, 301, { Location: `${base}${url.search}` }, '');
    }
    if (!pathname.startsWith(base)) {
      return plain(req, res, 404, 'Not Found (outside the base path)');
    }

    const target = resolve(root, pathname.slice(base.length));
    if (target !== root && !target.startsWith(root + sep)) {
      return plain(req, res, 404, 'Not Found');
    }

    const info = await stat(target).catch(() => null);
    if (info?.isFile()) return sendFile(req, res, 200, target);

    if (info?.isDirectory()) {
      if (!pathname.endsWith('/')) {
        return respond(req, res, 301, { Location: `${pathname}/${url.search}` }, '');
      }
      const indexPath = join(target, 'index.html');
      if ((await stat(indexPath).catch(() => null))?.isFile()) {
        return sendFile(req, res, 200, indexPath);
      }
    }

    return notFound(req, res);
  }

  return createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error(`pages-sim error: ${error.message}`);
      if (!res.headersSent) plain(req, res, 500, 'Internal Server Error');
      else res.end();
    });
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? '127.0.0.1';
  const distDir = process.env.DIST_DIR ?? 'dist';
  const base = process.env.VITE_BASE_PATH || '/morts-portfolio/';

  const server = createPagesSimServer({ distDir, base });
  server.listen(port, host, () => {
    console.log(`Pages simulator serving ${resolve(distDir)} at http://${host}:${port}${base}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
