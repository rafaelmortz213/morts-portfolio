// Configuration check. Runs before every build (npm run check:config) and in CI.
//
// The repository is public and every VITE_ variable is embedded in the public bundle, so this
// script fails the build when:
//   - VITE_BASE_PATH is set but malformed (must start and end with "/")
//   - any VITE_ variable name looks like it holds a secret
//   - environment files or key material are tracked by git (only .env.example is allowed)
//   - .env.example contains something that looks like a real value instead of a placeholder
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE_PATTERN = /^\/([A-Za-z0-9._~-]+\/)*$/;
const FORBIDDEN_NAME =
  /(SERVICE_ROLE|SECRET|PRIVATE|PASSWORD|PASSWD|API_KEY|ACCESS_TOKEN|AUTH_TOKEN)/i;
const ENV_FILE = /(^|\/)\.env(\..+)?$/;
const KEY_MATERIAL = /\.(pem|key|p12|pfx)$/i;
const JWT_SHAPE = /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\./;

/**
 * @param {{ env: Record<string, string | undefined>, trackedFiles?: string[] | null,
 *           exampleEnvContent?: string | null }} input
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkConfig({ env, trackedFiles = null, exampleEnvContent = null }) {
  const errors = [];
  const warnings = [];

  const base = env.VITE_BASE_PATH;
  if (base !== undefined && base !== '' && !BASE_PATTERN.test(base)) {
    errors.push(
      `VITE_BASE_PATH must start and end with "/" (for example /morts-portfolio/): got "${base}"`,
    );
  }

  for (const name of Object.keys(env)) {
    if (name.startsWith('VITE_') && FORBIDDEN_NAME.test(name)) {
      errors.push(`${name}: VITE_ variables are public. Secret-looking names are not allowed.`);
    }
  }

  if (trackedFiles === null) {
    warnings.push('Tracked-file check skipped (git is unavailable or this is not a repository).');
  } else {
    for (const file of trackedFiles) {
      if (ENV_FILE.test(file) && !file.endsWith('.env.example')) {
        errors.push(`${file} is tracked by git. Only .env.example may be committed.`);
      }
      if (KEY_MATERIAL.test(file)) {
        errors.push(`${file} looks like key material and must not be tracked.`);
      }
    }
  }

  if (exampleEnvContent) {
    for (const rawLine of exampleEnvContent.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === '' || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator === -1) continue;
      const name = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (FORBIDDEN_NAME.test(name)) {
        errors.push(`.env.example: ${name} has a secret-looking name.`);
      }
      if (value.length > 80 || JWT_SHAPE.test(value)) {
        errors.push(`.env.example: ${name} looks like a real value. Use a short placeholder.`);
      }
    }
  }

  return { errors, warnings };
}

function listTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const examplePath = resolve('.env.example');
  const { errors, warnings } = checkConfig({
    env: process.env,
    trackedFiles: listTrackedFiles(),
    exampleEnvContent: existsSync(examplePath) ? readFileSync(examplePath, 'utf8') : null,
  });

  for (const warning of warnings) console.warn(`config warning: ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`config error: ${error}`);
    process.exit(1);
  }
  console.log('config check passed');
}
