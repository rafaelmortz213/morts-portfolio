import { useSearchParams } from 'react-router-dom';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function ProjectsPage() {
  const [searchParams] = useSearchParams();
  const filters = Array.from(searchParams.entries());

  return (
    <PlaceholderPage title="Projects" routePattern="/projects" plannedPhase="Phase 4">
      {/* Routing-test hook: shows that query strings survive direct visits and refreshes. */}
      <p data-testid="query-echo">
        {filters.length === 0
          ? 'No query parameters.'
          : `Query parameters: ${filters.map(([key, value]) => `${key}=${value}`).join(', ')}`}
      </p>
    </PlaceholderPage>
  );
}
