import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { createPagesSimServer } from './serve-pages-sim.mjs';
import { BASE, listen, makeFakeDist } from './test-helpers.mjs';
import { runSmoke } from './smoke.mjs';

const quiet = () => {};

async function withServer(options, run) {
  const dist = await makeFakeDist(options);
  const running = await listen(createPagesSimServer({ distDir: dist.dir, base: BASE }));
  try {
    return await run(running.origin, dist.dir);
  } finally {
    await running.close();
    await dist.cleanup();
  }
}

test('passes against a healthy Pages-like site', async () => {
  await withServer({}, async (origin) => {
    const { ok, results } = await runSmoke(`${origin}${BASE}`, {
      attempts: 1,
      delayMs: 0,
      log: quiet,
    });
    assert.equal(ok, true, JSON.stringify(results));
    assert.equal(results.length, 4);
  });
});

test('fails when the 404 fallback is missing (deep links would not render the app)', async () => {
  await withServer({ with404: false }, async (origin) => {
    const { ok, results } = await runSmoke(`${origin}${BASE}`, {
      attempts: 1,
      delayMs: 0,
      log: quiet,
    });
    assert.equal(ok, false);
    assert.equal(results.find((result) => result.name.startsWith('deep link')).ok, false);
  });
});

test('fails when the main script is missing', async () => {
  await withServer({}, async (origin, dir) => {
    await rm(join(dir, 'assets', 'index-test.js'));
    const { ok, results } = await runSmoke(`${origin}${BASE}`, {
      attempts: 1,
      delayMs: 0,
      log: quiet,
    });
    assert.equal(ok, false);
    assert.equal(results.find((result) => result.name === 'main script loads').ok, false);
  });
});

test('fails when the site is unreachable', async () => {
  const { ok } = await runSmoke('http://127.0.0.1:9/morts-portfolio/', {
    attempts: 1,
    delayMs: 0,
    log: quiet,
  });
  assert.equal(ok, false);
});
