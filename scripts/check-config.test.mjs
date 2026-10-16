import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkConfig } from './check-config.mjs';

const clean = {
  env: { VITE_BASE_PATH: '/morts-portfolio/' },
  trackedFiles: ['.env.example', 'src/main.tsx'],
};

test('accepts a valid configuration', () => {
  const { errors } = checkConfig(clean);
  assert.deepEqual(errors, []);
});

test('accepts an unset base path (the default applies)', () => {
  assert.deepEqual(checkConfig({ env: {}, trackedFiles: [] }).errors, []);
});

test('accepts the root base path', () => {
  assert.deepEqual(checkConfig({ env: { VITE_BASE_PATH: '/' }, trackedFiles: [] }).errors, []);
});

test('rejects a base path without leading or trailing slash', () => {
  assert.equal(checkConfig({ env: { VITE_BASE_PATH: 'morts-portfolio/' } }).errors.length, 1);
  assert.equal(checkConfig({ env: { VITE_BASE_PATH: '/morts-portfolio' } }).errors.length, 1);
});

test('rejects secret-looking VITE_ variable names', () => {
  const { errors } = checkConfig({
    env: { VITE_SUPABASE_SERVICE_ROLE_KEY: 'x', VITE_RESEND_API_KEY: 'y' },
    trackedFiles: [],
  });
  assert.equal(errors.length, 2);
});

test('allows the public Supabase anon key name', () => {
  const { errors } = checkConfig({
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'public' },
    trackedFiles: [],
  });
  assert.deepEqual(errors, []);
});

test('rejects tracked env files and key material but allows .env.example', () => {
  const { errors } = checkConfig({
    env: {},
    trackedFiles: ['.env.example', '.env', '.env.production', 'certs/server.pem', 'src/app.ts'],
  });
  assert.equal(errors.length, 3);
});

test('warns when tracked files cannot be listed', () => {
  const { errors, warnings } = checkConfig({ env: {}, trackedFiles: null });
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
});

test('rejects real-looking values in .env.example', () => {
  const jwt = ['eyJhbGciOiJIUzI1NiJ9', 'eyJyb2xlIjoiYW5vbiJ9', 'signaturepart'].join('.');
  const { errors } = checkConfig({
    env: {},
    trackedFiles: [],
    exampleEnvContent: `# comment\nVITE_BASE_PATH=/morts-portfolio/\nVITE_SUPABASE_ANON_KEY=${jwt}\nVITE_LONG=${'a'.repeat(90)}\n`,
  });
  assert.equal(errors.length, 2);
});

test('ignores comments and blank lines in .env.example', () => {
  const { errors } = checkConfig({
    env: {},
    trackedFiles: [],
    exampleEnvContent: '# SECRET_THING=should-be-ignored\n\nVITE_BASE_PATH=/morts-portfolio/\n',
  });
  assert.deepEqual(errors, []);
});
