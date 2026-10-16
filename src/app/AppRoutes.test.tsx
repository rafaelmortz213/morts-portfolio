import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ROUTE_EXPECTATIONS } from './routes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  document.title = '';
});

describe('placeholder routes', () => {
  it.each(ROUTE_EXPECTATIONS)(
    '$name renders exactly one <h1> and a title',
    ({ samplePath, h1, documentTitle }) => {
      const { container } = renderAt(samplePath);
      const headings = container.querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0]?.textContent).toBe(h1);
      expect(document.title).toBe(documentTitle);
    },
  );

  it('uses a unique document title for every route', () => {
    const titles = ROUTE_EXPECTATIONS.map(({ documentTitle }) => documentTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('shows query parameters on the projects placeholder', () => {
    const { getByTestId } = renderAt('/projects?category=test-fixture');
    expect(getByTestId('query-echo').textContent).toContain('category=test-fixture');
  });

  it('renders the project slug as text, not markup', () => {
    const { container } = renderAt('/projects/%3Cb%3Ebold');
    expect(container.querySelector('h1 b')).toBeNull();
    expect(container.querySelector('h1')?.textContent).toBe('Project: <b>bold');
  });
});
