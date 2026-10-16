import assert from 'node:assert/strict';
import { request } from 'node:http';
import { after, before, test } from 'node:test';
import { createPagesSimServer } from './serve-pages-sim.mjs';
import { BASE, INDEX_HTML, listen, makeFakeDist } from './test-helpers.mjs';

let dist;
let running;

before(async () => {
  dist = await makeFakeDist();
  running = await listen(createPagesSimServer({ distDir: dist.dir, base: BASE }));
});

after(async () => {
  await running.close();
  await dist.cleanup();
});

const get = (path, options = {}) =>
  fetch(`${running.origin}${path}`, { redirect: 'manual', ...options });

test('serves the home page with 200', async () => {
  const response = await get(BASE);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), INDEX_HTML);
});

test('serves existing files with 200 and the right content type', async () => {
  const script = await get(`${BASE}assets/index-test.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  const icon = await get(`${BASE}favicon.svg`);
  assert.equal(icon.status, 200);
  assert.equal(icon.headers.get('content-type'), 'image/svg+xml');
});

test('serves 404.html with status 404 for client-side routes (Pages behavior)', async () => {
  for (const path of ['projects', 'projects/test-slug', 'admin/login', 'no/such/route']) {
    const response = await get(`${BASE}${path}`);
    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), INDEX_HTML, path);
  }
});

test('keeps the query string on client-side routes', async () => {
  const response = await get(`${BASE}projects?category=test`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /id="root"/);
});

test('redirects the base path without a trailing slash', async () => {
  const response = await get('/morts-portfolio');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), BASE);
});

test('returns a plain 404 outside the base path', async () => {
  const response = await get('/other/path');
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /id="root"/);
});

test('does not serve files outside dist (path traversal)', async () => {
  const status = await new Promise((done, fail) => {
    const url = new URL(running.origin);
    const req = request(
      { host: url.hostname, port: url.port, path: `${BASE}..%2F..%2Fetc%2Fpasswd` },
      (res) => {
        res.resume();
        done(res.statusCode);
      },
    );
    req.on('error', fail);
    req.end();
  });
  assert.equal(status, 404);
});

test('rejects non-GET methods', async () => {
  const response = await get(BASE, { method: 'POST' });
  assert.equal(response.status, 405);
});
