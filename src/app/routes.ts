/**
 * Route table for the Phase 1 placeholder site.
 * `title` is the page name used for the <h1> and the document title.
 * Real content, layouts and styling arrive in later phases.
 */
export interface NavRoute {
  path: string;
  label: string;
}

export const PUBLIC_NAV: readonly NavRoute[] = [
  { path: '/projects', label: 'Projects' },
  { path: '/services', label: 'Services' },
  { path: '/about', label: 'About' },
  { path: '/certificates', label: 'Certificates' },
  { path: '/resume', label: 'Resume' },
  { path: '/contact', label: 'Contact' },
];

/** Every route the app must resolve, with a sample URL and the expected <h1>. Used by tests. */
export interface RouteExpectation {
  name: string;
  samplePath: string;
  h1: string;
  documentTitle: string;
}

export const ROUTE_EXPECTATIONS: readonly RouteExpectation[] = [
  { name: 'home', samplePath: '/', h1: 'Home', documentTitle: 'Home | MORTS.' },
  { name: 'projects', samplePath: '/projects', h1: 'Projects', documentTitle: 'Projects | MORTS.' },
  {
    name: 'project detail',
    samplePath: '/projects/test-fixture-slug',
    h1: 'Project: test-fixture-slug',
    documentTitle: 'Project: test-fixture-slug | MORTS.',
  },
  { name: 'services', samplePath: '/services', h1: 'Services', documentTitle: 'Services | MORTS.' },
  {
    name: 'certificates',
    samplePath: '/certificates',
    h1: 'Certificates',
    documentTitle: 'Certificates | MORTS.',
  },
  { name: 'about', samplePath: '/about', h1: 'About', documentTitle: 'About | MORTS.' },
  { name: 'resume', samplePath: '/resume', h1: 'Resume', documentTitle: 'Resume | MORTS.' },
  { name: 'contact', samplePath: '/contact', h1: 'Contact', documentTitle: 'Contact | MORTS.' },
  { name: 'privacy', samplePath: '/privacy', h1: 'Privacy', documentTitle: 'Privacy | MORTS.' },
  {
    name: 'admin login',
    samplePath: '/admin/login',
    h1: 'Admin sign in',
    documentTitle: 'Admin sign in | MORTS.',
  },
  {
    name: 'not found',
    samplePath: '/this-route-does-not-exist',
    h1: 'Page not found',
    documentTitle: 'Page not found | MORTS.',
  },
];
