import { defineConfig, devices } from '@playwright/test';

// Two modes, same tests:
//   - Local (default): runs against scripts/serve-pages-sim.mjs, which mimics the GitHub Pages
//     404.html fallback. Build first: `npm run build`. This is NOT proof the deployed site works.
//   - Deployed: set E2E_BASE_URL (for example https://rafaelmortz213.github.io/morts-portfolio/).
const deployedUrl = process.env.E2E_BASE_URL;
const localUrl = 'http://127.0.0.1:4173/morts-portfolio/';
const baseURL = (deployedUrl ?? localUrl).replace(/\/?$/, '/');

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: deployedUrl
    ? undefined
    : {
        command: 'npm run serve:pages-sim',
        url: localUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
