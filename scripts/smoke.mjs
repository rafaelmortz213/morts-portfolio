// Post-deployment smoke test for the GitHub Pages site.
//
// Usage: node scripts/smoke.mjs https://rafaelmortz213.github.io/morts-portfolio/
//
// Checks (with retries, because Pages can take a short while to serve a new deployment):
//   1. Home page: HTTP 200, HTML, contains the app shell (#root) and a title.
//   2. Deep link (/projects/smoke-test-slug): the app shell is served. HTTP 404 is ACCEPTED here
//      because the index.html-as-404.html strategy makes Pages answer 404 while serving the app.
//   3. The main script referenced by the home page loads with a JavaScript content type.
//   4. The favicon referenced by the home page loads.
// This confirms the deployment is reachable and routes to the app shell. It does not render the
// app; the Playwright route matrix does that.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    body: await response.text(),
  };
}

function firstMatch(html, pattern) {
  return pattern.exec(html)?.[1] ?? null;
}

async function runChecks(siteUrl) {
  const results = [];
  const record = (name, ok, detail) => results.push({ name, ok, detail });

  const home = await fetchText(siteUrl);
  record(
    'home page',
    home.status === 200 &&
      home.contentType.includes('text/html') &&
      home.body.includes('id="root"') &&
      /<title>[^<]+<\/title>/.test(home.body),
    `status ${home.status}, ${home.contentType || 'no content type'}`,
  );

  const deepUrl = new URL('projects/smoke-test-slug', siteUrl).href;
  const deep = await fetchText(deepUrl);
  record(
    'deep link serves the app shell',
    (deep.status === 200 || deep.status === 404) && deep.body.includes('id="root"'),
    `status ${deep.status} (200 or 404 accepted), shell ${deep.body.includes('id="root"') ? 'present' : 'missing'}`,
  );

  const scriptSrc = firstMatch(home.body, /<script[^>]+src="([^"]+)"/);
  if (scriptSrc) {
    const script = await fetch(new URL(scriptSrc, siteUrl));
    await script.arrayBuffer();
    record(
      'main script loads',
      script.status === 200 && (script.headers.get('content-type') ?? '').includes('javascript'),
      `${scriptSrc} -> ${script.status}`,
    );
  } else {
    record('main script loads', false, 'no <script src> found in the home page');
  }

  const iconHref = firstMatch(home.body, /<link[^>]+rel="icon"[^>]+href="([^"]+)"/);
  if (iconHref) {
    const icon = await fetch(new URL(iconHref, siteUrl));
    await icon.arrayBuffer();
    record('favicon loads', icon.status === 200, `${iconHref} -> ${icon.status}`);
  } else {
    record('favicon loads', false, 'no icon link found in the home page');
  }

  return results;
}

export async function runSmoke(
  siteUrl,
  { attempts = 6, delayMs = 10_000, log = console.log } = {},
) {
  const normalized = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  let results = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      results = await runChecks(normalized);
    } catch (error) {
      results = [{ name: 'request', ok: false, detail: error.message }];
    }
    const ok = results.every((result) => result.ok);
    log(`smoke attempt ${attempt}/${attempts}: ${ok ? 'passed' : 'failed'}`);
    for (const result of results) {
      log(`  ${result.ok ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}`);
    }
    if (ok) return { ok: true, results };
    if (attempt < attempts) await sleep(delayMs);
  }
  return { ok: false, results };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const siteUrl = process.argv[2];
  if (!siteUrl) {
    console.error('Usage: node scripts/smoke.mjs <site-url>');
    process.exit(2);
  }
  const { ok } = await runSmoke(siteUrl, {
    attempts: Number(process.env.SMOKE_ATTEMPTS ?? 6),
    delayMs: Number(process.env.SMOKE_DELAY_MS ?? 10_000),
  });
  process.exit(ok ? 0 : 1);
}
