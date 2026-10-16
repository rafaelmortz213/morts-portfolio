import { expect, test, type Page, type Response } from '@playwright/test';

/**
 * Route matrix for the GitHub Pages routing strategy (index.html copied to 404.html).
 *
 * The same tests run against the local Pages simulator and against the deployed site
 * (E2E_BASE_URL). Paths are relative to baseURL, which ends with the base path.
 *
 * Fixture data: "test-fixture-slug" and "category=test-fixture" are test values, not content.
 */

interface RouteCase {
  name: string;
  path: string;
  h1: string;
  title: RegExp;
  isHome?: boolean;
}

const ROUTES: RouteCase[] = [
  { name: 'home', path: './', h1: 'Home', title: /^Home \| MORTS\.$/, isHome: true },
  { name: 'projects', path: 'projects', h1: 'Projects', title: /^Projects \| MORTS\.$/ },
  {
    name: 'project detail (fixture slug)',
    path: 'projects/test-fixture-slug',
    h1: 'Project: test-fixture-slug',
    title: /^Project: test-fixture-slug \| MORTS\.$/,
  },
  { name: 'services', path: 'services', h1: 'Services', title: /^Services \| MORTS\.$/ },
  {
    name: 'certificates',
    path: 'certificates',
    h1: 'Certificates',
    title: /^Certificates \| MORTS\.$/,
  },
  { name: 'about', path: 'about', h1: 'About', title: /^About \| MORTS\.$/ },
  { name: 'resume', path: 'resume', h1: 'Resume', title: /^Resume \| MORTS\.$/ },
  { name: 'contact', path: 'contact', h1: 'Contact', title: /^Contact \| MORTS\.$/ },
  { name: 'privacy', path: 'privacy', h1: 'Privacy', title: /^Privacy \| MORTS\.$/ },
  {
    name: 'admin login',
    path: 'admin/login',
    h1: 'Admin sign in',
    title: /^Admin sign in \| MORTS\.$/,
  },
  {
    name: 'unknown route',
    path: 'this-route-does-not-exist',
    h1: 'Page not found',
    title: /^Page not found \| MORTS\.$/,
  },
  {
    name: 'unknown nested route',
    path: 'projects/a/b/c',
    h1: 'Page not found',
    title: /^Page not found \| MORTS\.$/,
  },
  {
    name: 'projects with query string',
    path: 'projects?category=test-fixture&sort=name',
    h1: 'Projects',
    title: /^Projects \| MORTS\.$/,
  },
];

/** Collects problems that must not happen on any route: JS errors, failed or error responses. */
function monitor(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // The 404 status of a deep-link document is expected with this routing strategy.
    const isDocument404 =
      message.text().includes('status of 404') && message.location().url === page.url();
    if (!isDocument404) problems.push(`console error: ${message.text()}`);
  });
  page.on('requestfailed', (request) =>
    problems.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
    ),
  );
  page.on('response', (response) => {
    if (response.request().resourceType() !== 'document' && response.status() >= 400) {
      problems.push(`HTTP ${response.status()} for ${response.url()}`);
    }
  });
  return problems;
}

/** GitHub Pages answers 404 for client-side routes (and serves the app via 404.html). */
function expectDocumentStatus(response: Response | null, route: RouteCase): void {
  expect(response, 'navigation response').not.toBeNull();
  const status = response?.status() ?? 0;
  if (route.isHome) expect(status).toBe(200);
  else expect([200, 404]).toContain(status);
}

async function expectPage(page: Page, route: RouteCase): Promise<void> {
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(route.h1);
  await expect(page).toHaveTitle(route.title);
  if (route.path.includes('?')) {
    await expect(page.getByTestId('query-echo')).toContainText('category=test-fixture');
    expect(page.url()).toContain('?category=test-fixture&sort=name');
  }
}

for (const route of ROUTES) {
  test.describe(route.name, () => {
    test('direct navigation renders the page', async ({ page }) => {
      const problems = monitor(page);
      const response = await page.goto(route.path);
      expectDocumentStatus(response, route);
      await expectPage(page, route);
      expect(problems).toEqual([]);
    });

    test('refresh keeps the page', async ({ page }) => {
      const problems = monitor(page);
      await page.goto(route.path);
      const response = await page.reload();
      expectDocumentStatus(response, route);
      await expectPage(page, route);
      expect(problems).toEqual([]);
    });
  });
}

test.describe('navigation behavior', () => {
  const primaryNav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });

  test('back and forward work after client-side navigation', async ({ page }) => {
    await page.goto('./');
    await primaryNav(page).getByRole('link', { name: 'Projects' }).click();
    await expect(page.locator('h1')).toHaveText('Projects');

    await page.goBack();
    await expect(page.locator('h1')).toHaveText('Home');

    await page.goForward();
    await expect(page.locator('h1')).toHaveText('Projects');
  });

  test('back works when the first page was a deep link', async ({ page }) => {
    await page.goto('projects/test-fixture-slug');
    await primaryNav(page).getByRole('link', { name: 'Services' }).click();
    await expect(page.locator('h1')).toHaveText('Services');

    await page.goBack();
    await expect(page.locator('h1')).toHaveText('Project: test-fixture-slug');
  });

  test('in-app links navigate without a full page reload', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => {
      (window as unknown as { __marker?: string }).__marker = 'alive';
    });
    await primaryNav(page).getByRole('link', { name: 'About' }).click();
    await expect(page.locator('h1')).toHaveText('About');
    const marker = await page.evaluate(() => (window as unknown as { __marker?: string }).__marker);
    expect(marker).toBe('alive');
  });

  test('the not-found page links back to the home page', async ({ page }) => {
    await page.goto('this-route-does-not-exist');
    await page.getByRole('link', { name: 'Go to the home page' }).click();
    await expect(page.locator('h1')).toHaveText('Home');
  });
});

test.describe('base path and assets', () => {
  test('scripts, styles and the icon load from the base path on a deep link', async ({
    page,
    baseURL,
  }) => {
    const problems = monitor(page);
    await page.goto('projects/test-fixture-slug');

    const basePath = new URL(baseURL ?? 'http://invalid/').pathname;
    const urls = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          'script[src], link[rel="stylesheet"], link[rel="icon"]',
        ),
      ).map((element) => (element as HTMLScriptElement).src || (element as HTMLLinkElement).href),
    );

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(new URL(url).pathname.startsWith(basePath), url).toBe(true);
    }
    expect(problems).toEqual([]);
  });
});
