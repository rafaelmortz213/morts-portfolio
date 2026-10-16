import type { ReactNode } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface PlaceholderPageProps {
  /** Page name: used as the single <h1> and in the document title. */
  title: string;
  /** Route pattern, shown so each placeholder is distinguishable. */
  routePattern: string;
  /** Phase in which the real page is planned. */
  plannedPhase: string;
  children?: ReactNode;
}

/** Minimal placeholder. It contains no portfolio content of any kind. */
export function PlaceholderPage({
  title,
  routePattern,
  plannedPhase,
  children,
}: PlaceholderPageProps) {
  useDocumentTitle(title);

  return (
    <section>
      <h1>{title}</h1>
      <p>
        Placeholder for route <code>{routePattern}</code>. The real page is planned for{' '}
        {plannedPhase}.
      </p>
      {children}
    </section>
  );
}
