import { PlaceholderPage } from '../components/PlaceholderPage';

/** Placeholder only: no authentication, no form, no Supabase in Phase 1. */
export function AdminLoginPage() {
  return (
    <PlaceholderPage title="Admin sign in" routePattern="/admin/login" plannedPhase="Phase 6" />
  );
}
