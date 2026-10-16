// Scans the built output for anything that looks like a privileged secret.
//
// The site is static and public, so nothing in dist/ may contain a service-role key, provider
// key, private key or access token. Matches are reported by file and rule only, with the value
// redacted. This is a safety net, not a replacement for keeping secrets out of the code.
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.html',
  '.json',
  '.txt',
  '.map',
  '.svg',
  '.xml',
  '.webmanifest',
]);

const LITERALS = [
  ['service_role', 'service-role key name'],
  ['sb_secret_', 'Supabase secret key prefix'],
  ['SUPABASE_SERVICE', 'Supabase service variable name'],
];

const PATTERNS = [
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['github-fine-grained-token', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['aws-access-key-id', /\bAKIA[0-9A-Z]{16}\b/],
  ['resend-api-key', /\bre_[A-Za-z0-9_]{20,}\b/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
];

const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;

function redact(value) {
  return `${value.slice(0, 4)}...(${value.length} chars)`;
}

function decodeJwtPayload(token) {
  try {
    const segment = token.split('.')[1] ?? '';
    const json = Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    );
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** @returns {{ file: string, rule: string, sample: string }[]} */
export function scanContent(text, file) {
  const findings = [];

  for (const [literal, rule] of LITERALS) {
    if (text.toLowerCase().includes(literal.toLowerCase())) {
      findings.push({ file, rule, sample: literal });
    }
  }

  for (const [rule, pattern] of PATTERNS) {
    const match = pattern.exec(text);
    if (match) findings.push({ file, rule, sample: redact(match[0]) });
  }

  for (const match of text.matchAll(JWT_PATTERN)) {
    const payload = decodeJwtPayload(match[0]);
    if (payload && 'role' in payload && payload.role !== 'anon') {
      findings.push({
        file,
        rule: `jwt-with-role-${String(payload.role)}`,
        sample: redact(match[0]),
      });
    }
  }

  return findings;
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else if (entry.isFile()) yield fullPath;
  }
}

/** @returns {Promise<{ scanned: number, findings: { file: string, rule: string, sample: string }[] }>} */
export async function scanDirectory(directory) {
  const findings = [];
  let scanned = 0;
  for await (const file of walk(directory)) {
    if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) continue;
    scanned += 1;
    findings.push(...scanContent(await readFile(file, 'utf8'), file));
  }
  return { scanned, findings };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const directory = process.argv[2] ?? 'dist';
  try {
    const { scanned, findings } = await scanDirectory(directory);
    if (scanned === 0) {
      console.error(`secret scan: no scannable files found in "${directory}". Did the build run?`);
      process.exit(1);
    }
    if (findings.length > 0) {
      for (const { file, rule, sample } of findings) {
        console.error(`secret scan: ${rule} in ${file} (${sample})`);
      }
      console.error(`secret scan FAILED: ${findings.length} finding(s) in ${scanned} files.`);
      process.exit(1);
    }
    console.log(`secret scan passed: ${scanned} files, no findings.`);
  } catch (error) {
    console.error(`secret scan could not run: ${error.message}`);
    process.exit(1);
  }
}
