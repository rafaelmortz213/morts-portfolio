import { useEffect } from 'react';

export const SITE_NAME = 'MORTS.';

/** Sets a unique document title for the current route: "<page> | MORTS." */
export function useDocumentTitle(pageTitle: string): void {
  useEffect(() => {
    document.title = `${pageTitle} | ${SITE_NAME}`;
  }, [pageTitle]);
}
