import { describe, expect, it } from 'vitest';
import { routerBasename, withBase } from './basePath';

describe('routerBasename', () => {
  it('removes the trailing slash from a project-site base', () => {
    expect(routerBasename('/morts-portfolio/')).toBe('/morts-portfolio');
  });

  it('keeps the root base as "/"', () => {
    expect(routerBasename('/')).toBe('/');
  });

  it('handles nested bases', () => {
    expect(routerBasename('/a/b/')).toBe('/a/b');
  });

  it('is stable when the trailing slash is missing', () => {
    expect(routerBasename('/morts-portfolio')).toBe('/morts-portfolio');
  });
});

describe('withBase', () => {
  it('prefixes public assets with the base URL', () => {
    expect(withBase('favicon.svg', '/morts-portfolio/')).toBe('/morts-portfolio/favicon.svg');
  });

  it('does not double slashes', () => {
    expect(withBase('/favicon.svg', '/morts-portfolio/')).toBe('/morts-portfolio/favicon.svg');
  });

  it('works with the root base', () => {
    expect(withBase('favicon.svg', '/')).toBe('/favicon.svg');
  });
});
