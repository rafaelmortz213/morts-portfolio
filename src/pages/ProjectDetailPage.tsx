import { useParams } from 'react-router-dom';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function ProjectDetailPage() {
  const { slug = '' } = useParams();

  return (
    <PlaceholderPage
      title={`Project: ${slug}`}
      routePattern="/projects/:slug"
      plannedPhase="Phase 4"
    />
  );
}
