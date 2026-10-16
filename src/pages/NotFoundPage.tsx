import { Link } from 'react-router-dom';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function NotFoundPage() {
  return (
    <PlaceholderPage title="Page not found" routePattern="*" plannedPhase="Phase 2">
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </PlaceholderPage>
  );
}
