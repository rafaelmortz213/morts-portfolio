/**
 * Base-path helpers.
 *
 * Vite exposes the configured `base` as `import.meta.env.BASE_URL` ("/morts-portfolio/" on
 * GitHub Pages). Everything that depends on the base path reads it from there, so the build
 * base and the router basename cannot disagree.
 */

/** Router basename for a Vite base URL: "/morts-portfolio/" becomes "/morts-portfolio", "/" stays "/". */
export function routerBasename(baseUrl: string = import.meta.env.BASE_URL): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Prefix a path that lives in /public (for example "favicon.svg") with the base URL. */
export function withBase(path: string, baseUrl: string = import.meta.env.BASE_URL): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${path.replace(/^\/+/, '')}`;
}
