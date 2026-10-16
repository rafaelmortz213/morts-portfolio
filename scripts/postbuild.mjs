// Post-build step for GitHub Pages SPA routing.
//
// 1. Verifies the built index.html is the app shell and references assets under the base path
//    (catches a wrong `base` before it is deployed).
// 2. Copies dist/index.html to dist/404.html. GitHub Pages serves 404.html for unknown paths,
//    so a direct visit or refresh on a client-side route renders the app, and React Router then
//    resolves the URL. See README, "Routing on GitHub Pages", for the HTTP 404 trade-off.
import { copyFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASE = '/morts-portfolio/';

export async function runPostbuild({
  distDir = 'dist',
  base = process.env.VITE_BASE_PATH || DEFAULT_BASE,
} = {}) {
  const indexPath = join(distDir, 'index.html');
  const notFoundPath = join(distDir, '404.html');

  let html;
  try {
    html = await readFile(indexPath, 'utf8');
  } catch {
    throw new Error(`Missing ${indexPath}. Run the Vite build before the post-build step.`);
  }

  if (!html.includes('id="root"')) {
    throw new Error(`${indexPath} does not contain the #root app shell element.`);
  }
  if (!html.includes(`"${base}assets/`)) {
    throw new Error(
      `${indexPath} does not reference assets under the base path "${base}". ` +
        'The Vite base and VITE_BASE_PATH disagree.',
    );
  }

  await copyFile(indexPath, notFoundPath);
  return { indexPath, notFoundPath };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    const { notFoundPath } = await runPostbuild();
    console.log(`postbuild: copied index.html to ${notFoundPath}`);
  } catch (error) {
    console.error(`postbuild failed: ${error.message}`);
    process.exit(1);
  }
}
