# MORTS. Portfolio

Practical Software. Thoughtful Solutions.

Phase 1 foundation: project scaffold, placeholder routes, GitHub Pages routing, CI and deployment.
There is no portfolio content, backend, or design system yet; those belong to later phases.

- Repository: https://github.com/rafaelmortz213/morts-portfolio (public)
- Site URL: https://rafaelmortz213.github.io/morts-portfolio/
- Vite base path: `/morts-portfolio/`

## Prerequisites

- Node.js 22 or newer (`.nvmrc` pins 22; run `nvm use` if you use nvm)
- npm 10 or newer (ships with Node 22)
- Git

## Installation and local development

```bash
npm ci          # reproducible install from package-lock.json
npm run dev     # Vite dev server; the app is served under /morts-portfolio/
```

Open the URL Vite prints (for example `http://localhost:5173/morts-portfolio/`).

Copy `.env.example` to `.env.local` only if you need to override a value. `.env.local` is ignored
by git.

## Scripts

| Script                    | What it does                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server                                                                    |
| `npm run build`           | Config check, type check, production build, then copies `index.html` to `404.html` |
| `npm run preview`         | Serves `dist/` with Vite preview (does **not** reproduce the Pages 404 behavior)   |
| `npm run serve:pages-sim` | Serves `dist/` the way GitHub Pages does, including `404.html` with status 404     |
| `npm run typecheck`       | `tsc -b` with strict settings                                                      |
| `npm run lint`            | ESLint                                                                             |
| `npm run format`          | Prettier, write                                                                    |
| `npm run format:check`    | Prettier, check only (used in CI)                                                  |
| `npm test`                | Vitest unit and component tests                                                    |
| `npm run test:scripts`    | Node tests for the build and deployment scripts in `scripts/`                      |
| `npm run test:e2e`        | Playwright route matrix (local Pages simulator by default)                         |
| `npm run check:config`    | Fails on malformed base path, secret-looking `VITE_` names, tracked `.env` files   |
| `npm run scan:dist`       | Scans `dist/` for secret patterns                                                  |
| `npm run smoke -- <url>`  | Post-deployment smoke test against a URL                                           |
| `npm run validate`        | Runs the full local validation sequence                                            |

## Type checking, linting and tests

```bash
npm run typecheck
npm run lint
npm test
npm run test:scripts
```

## Build and preview

```bash
npm run build                     # writes dist/ including dist/404.html
npm run serve:pages-sim           # http://127.0.0.1:4173/morts-portfolio/
```

### Route-matrix tests (Playwright)

```bash
npx playwright install chromium   # first time only
npm run build
npm run test:e2e                  # starts the Pages simulator automatically
```

To run the same tests against the deployed site:

```bash
E2E_BASE_URL=https://rafaelmortz213.github.io/morts-portfolio/ npm run test:e2e
```

A local run is not proof that the deployed site works. The deploy workflow runs the matrix again
against the real URL after each deployment.

## Routing on GitHub Pages

GitHub Pages serves static files only. If someone opens or refreshes
`/morts-portfolio/projects/some-slug`, no file exists at that path, so Pages answers with
`404.html`.

**Strategy used (primary):** the build copies `dist/index.html` to `dist/404.html`. Pages serves
that copy for unknown paths, so the full app loads at the requested URL and React Router renders
the right page. Vite writes absolute asset URLs under the base path, so assets load from any depth.

The router basename is derived from `import.meta.env.BASE_URL` (`src/lib/basePath.ts`), the same
value Vite uses as `base`, so the two cannot disagree.

**HTTP 404 limitation:** for these direct visits Pages still sends the HTTP status **404**, even
though the page renders correctly. The home page (`/morts-portfolio/`) is a real file and returns 200. Consequences:

- Search engines may treat deep links as missing pages. This is why prerendering is evaluated
  after the first deployment rather than relying on this strategy for search visibility.
- Network tools, uptime monitors and link checkers see a 404 status for those URLs.
- Browsers are unaffected: users see the page.

**Alternatives (documented, not implemented unless testing shows the primary strategy fails):**

1. Redirect script: `404.html` stores the requested path and redirects to `index.html`; a small
   script in `index.html` restores the route (the "spa-github-pages" pattern). Still returns 404
   for the first request and adds a visible redirect.
2. `HashRouter`: URLs look like `/#/projects/slug`. Works without any hosting workaround, but URLs
   are less clean and share worse.

## GitHub Pages configuration (manual, once)

1. Repository **Settings > Pages > Build and deployment > Source**: choose **GitHub Actions**.
2. Keep **Enforce HTTPS** on. No custom domain for now.
3. **Settings > Actions > General > Workflow permissions**: keep **Read repository contents**.
   Workflows request extra permissions only where needed.
4. Optional: protect `main` (require the `Validate` check, require pull requests).

The `github-pages` environment is created automatically on the first deployment.

## Workflows

| File                           | Trigger                             | Purpose                                                                                         |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | Pull requests, and called by deploy | Config check, format, type check, lint, tests, build, secret scan, route matrix. Never deploys. |
| `.github/workflows/deploy.yml` | Push to `main`, manual              | Runs `ci.yml`, then build, upload artifact, deploy, smoke test, route matrix on the live URL    |

Deployment jobs depend on validation (`needs`), so a failing check stops the deployment and the
previous version stays live. Deployments are serialized by a `pages` concurrency group and never
cancelled midway. Only the deploy job has `pages: write` and `id-token: write`.

### How Actions are pinned

Only GitHub-owned actions are used (`actions/checkout`, `setup-node`, `configure-pages`,
`upload-pages-artifact`, `deploy-pages`, `upload-artifact`). They are pinned to major version tags,
and Dependabot (`.github/dependabot.yml`) opens weekly update pull requests. If you later add a
third-party action, pin it to a full commit SHA, because tags can be moved. Pinning the official
actions to commit SHAs as well is a possible hardening step.

Node comes from `.nvmrc` (22). Installs use `npm ci` against the committed `package-lock.json`.

## Dependencies and why

Exact versions are recorded in `package.json` and `package-lock.json`.

| Package                                                         | Purpose                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| `react`, `react-dom`                                            | UI library                                               |
| `react-router-dom`                                              | Client-side routing                                      |
| `lucide-react`                                                  | Icons (approved); one icon used so far                   |
| `vite`, `@vitejs/plugin-react`                                  | Dev server and production build                          |
| `typescript`, `@types/react`, `@types/react-dom`, `@types/node` | Strict type checking                                     |
| `vitest`, `jsdom`                                               | Unit and component test runner and DOM environment       |
| `@testing-library/react`, `@testing-library/dom`                | Component testing (the DOM package is a peer dependency) |
| `eslint`, `@eslint/js`, `typescript-eslint`                     | Linting                                                  |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`      | React-specific lint rules                                |
| `eslint-config-prettier`, `globals`                             | Avoid formatting conflicts; environment globals          |
| `prettier`                                                      | Formatting                                               |
| `@playwright/test`                                              | Route-matrix browser tests                               |

No Supabase packages are installed in Phase 1.

## Public-repository security practices

The repository is public. Treat every committed file as world-readable.

- Never commit real secrets, tokens, database credentials, provider keys, or `.env` files.
  `.gitignore` excludes `.env*` except `.env.example`, which holds names and safe placeholders only.
- Every `VITE_` variable is embedded in the public bundle. Do not put secrets in one.
  `npm run check:config` fails on secret-looking `VITE_` names and on tracked env files.
- `npm run scan:dist` scans the built output for service-role keys, private keys, provider keys,
  access tokens, and JWTs whose role is not `anon`. It runs in CI before every deployment.
- Turn on **Settings > Code security**: secret scanning and push protection.
- Turn on two-factor authentication for your GitHub account.
- CI uses the `pull_request` trigger (not `pull_request_target`) and no secrets, so pull requests
  from forks cannot reach privileged data. Keep fork-PR workflow approval enabled.
- Later phases keep privileged secrets (email provider key, service-role key) only as Supabase
  Edge Function secrets, never in this repository or in GitHub variables.
- If a secret is ever committed, rotate it immediately. Deleting it from history is not enough.

## Deployment troubleshooting

| Symptom                                              | Likely cause and fix                                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blank page, console shows 404 for `/assets/...`      | Base path mismatch. `VITE_BASE_PATH` must match the repository path, with slashes at both ends. `npm run build` fails early when the built HTML does not reference assets under the base. |
| Deploy job fails with "Pages not enabled" or similar | Set **Settings > Pages > Source** to **GitHub Actions** (see above).                                                                                                                      |
| `npm ci` fails                                       | `package-lock.json` missing or out of sync with `package.json`. Run `npm install` locally and commit the lockfile.                                                                        |
| Deep links show GitHub's own 404 page                | `dist/404.html` is missing from the artifact. Check the build log for the postbuild step.                                                                                                 |
| Smoke test fails right after deploy                  | Pages can take a minute to serve a new deployment. The script retries; re-run the job if needed.                                                                                          |
| Format check fails                                   | Run `npm run format` and commit.                                                                                                                                                          |
| Deployment waiting for approval                      | Environment protection rules on `github-pages` require a reviewer.                                                                                                                        |

### Rollback

- Fastest: **Actions > Deploy to GitHub Pages**, open the last good run on `main`, and use
  **Re-run all jobs**. This redeploys that commit.
- Permanent: `git revert <bad-commit>` on `main` and push; the normal pipeline deploys the revert.

## Project structure

```text
.github/workflows/   ci.yml, deploy.yml
e2e/                 Playwright route matrix
public/              static assets (favicon)
scripts/             config check, post-build, secret scan, Pages simulator, smoke test (+ tests)
src/app/             router setup and route table
src/components/      layout and placeholder page component
src/lib/             base-path helpers, document title hook
src/pages/           placeholder pages (no content)
src/styles/          minimal global reset
```
