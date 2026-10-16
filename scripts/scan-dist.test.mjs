import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { scanContent, scanDirectory } from './scan-dist.mjs';
import { makeFakeDist } from './test-helpers.mjs';

// Fixtures are assembled at runtime so this file never contains a real-looking secret.
const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const makeJwt = (payload) =>
  [b64url({ alg: 'HS256', typ: 'JWT' }), b64url(payload), 'c2lnbmF0dXJl'].join('.');

test('passes clean content', () => {
  assert.deepEqual(scanContent('const a = 1; // hello', 'a.js'), []);
});

test('allows a JWT whose role is anon', () => {
  const token = makeJwt({ iss: 'supabase', role: 'anon', ref: 'abc' });
  assert.deepEqual(scanContent(`const key="${token}"`, 'a.js'), []);
});

test('flags a JWT with the service role and redacts it', () => {
  const token = makeJwt({ iss: 'supabase', role: ['service', 'role'].join('_') });
  const findings = scanContent(`const key="${token}"`, 'a.js');
  assert.ok(findings.some((finding) => finding.rule === 'jwt-with-role-service_role'));
  assert.ok(findings.every((finding) => !finding.sample.includes(token)));
});

test('flags a JWT with any non-anon role', () => {
  const findings = scanContent(makeJwt({ role: 'authenticated' }), 'a.js');
  assert.equal(findings.length, 1);
});

test('flags service-role names and Supabase secret key prefixes', () => {
  const name = ['service', 'role'].join('_');
  assert.ok(scanContent(`env.${name}`, 'a.js').length >= 1);
  assert.ok(scanContent(`x="${['sb', 'secret', ''].join('_')}abcdef"`, 'a.js').length >= 1);
});

test('flags private keys, GitHub tokens, AWS key ids and Resend-style keys', () => {
  const rules = (text) => scanContent(text, 'a.js').map((finding) => finding.rule);
  assert.deepEqual(rules(`-----BEGIN ${'RSA PRIVATE'} KEY-----`), ['private-key']);
  assert.deepEqual(rules(`t="${'ghp' + '_'}${'a'.repeat(36)}"`), ['github-token']);
  assert.deepEqual(rules(`k="${'AKIA'}${'A'.repeat(16)}"`), ['aws-access-key-id']);
  assert.deepEqual(rules(`k="${'re' + '_'}${'a'.repeat(30)}"`), ['resend-api-key']);
});

test('scans a directory and ignores binary files', async () => {
  const { dir, cleanup } = await makeFakeDist();
  try {
    await mkdir(join(dir, 'assets'), { recursive: true });
    await writeFile(join(dir, 'assets', 'logo.png'), `${['service', 'role'].join('_')}`);
    const clean = await scanDirectory(dir);
    assert.equal(clean.findings.length, 0);
    assert.ok(clean.scanned >= 3);

    await writeFile(join(dir, 'assets', 'leak.js'), `x="${['service', 'role'].join('_')}"`);
    const dirty = await scanDirectory(dir);
    assert.equal(dirty.findings.length, 1);
    assert.ok(dirty.findings[0].file.endsWith('leak.js'));
  } finally {
    await cleanup();
  }
});
