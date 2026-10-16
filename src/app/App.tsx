import { BrowserRouter } from 'react-router-dom';
import { routerBasename } from '../lib/basePath';
import { AppRoutes } from './AppRoutes';

export function App() {
  // The basename comes from import.meta.env.BASE_URL, the same value Vite uses as `base`.
  return (
    <BrowserRouter basename={routerBasename()}>
      <AppRoutes />
    </BrowserRouter>
  );
}
