import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AboutPage } from '../pages/AboutPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { CertificatesPage } from '../pages/CertificatesPage';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ResumePage } from '../pages/ResumePage';
import { ServicesPage } from '../pages/ServicesPage';

/** Route tree, independent of the router type so tests can wrap it in a MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
