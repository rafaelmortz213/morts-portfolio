// Shared helpers for the script tests (not a test file itself).
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const BASE = '/morts-portfolio/';

export const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="${BASE}favicon.svg" />
    <title>MORTS.</title>
    <script type="module" crossorigin src="${BASE}assets/index-test.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>
`;

/** Creates a fake build output directory. Returns { dir, cleanup }. */
export async function makeFakeDist({ with404 = true, withAsset = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'morts-dist-'));
  await mkdir(join(dir, 'assets'), { recursive: true });
  await writeFile(join(dir, 'index.html'), INDEX_HTML);
  if (with404) await writeFile(join(dir, '404.html'), INDEX_HTML);
  if (withAsset) await writeFile(join(dir, 'assets', 'index-test.js'), 'console.log("fixture");\n');
  await writeFile(join(dir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

/** Starts a server on a random port. Returns { origin, close }. */
export function listen(server) {
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      done({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((closed) => server.close(closed)),
      });
    });
  });
}
