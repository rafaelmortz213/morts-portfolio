import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { runPostbuild } from './postbuild.mjs';
import { BASE, INDEX_HTML, makeFakeDist } from './test-helpers.mjs';

test('copies index.html to 404.html', async () => {
  const { dir, cleanup } = await makeFakeDist({ with404: false });
  try {
    await runPostbuild({ distDir: dir, base: BASE });
    assert.equal(await readFile(join(dir, '404.html'), 'utf8'), INDEX_HTML);
  } finally {
    await cleanup();
  }
});

test('fails when index.html is missing', async () => {
  await assert.rejects(runPostbuild({ distDir: '/nonexistent-dist-dir', base: BASE }), /Missing/);
});

test('fails when assets are not under the base path', async () => {
  const { dir, cleanup } = await makeFakeDist({ with404: false });
  try {
    await assert.rejects(runPostbuild({ distDir: dir, base: '/other-base/' }), /base path/);
  } finally {
    await cleanup();
  }
});

test('fails when the app shell element is missing', async () => {
  const { dir, cleanup } = await makeFakeDist({ with404: false });
  try {
    await writeFile(join(dir, 'index.html'), '<html><body>no shell</body></html>');
    await assert.rejects(runPostbuild({ distDir: dir, base: BASE }), /#root/);
  } finally {
    await cleanup();
  }
});
