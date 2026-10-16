import { Link, NavLink, Outlet } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { PUBLIC_NAV } from '../../app/routes';
import styles from './Layout.module.css';

/** Phase 1 shell: navigation and footer only. The design system arrives in Phase 2. */
export function Layout() {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          MORTS.
        </Link>
        <nav aria-label="Primary">
          <ul className={styles.navList}>
            {PUBLIC_NAV.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <p className={styles.notice}>
        <Wrench size={16} aria-hidden="true" focusable="false" /> Foundation build: placeholder
        pages only.
      </p>
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>Practical Software. Thoughtful Solutions.</p>
        <p>
          <Link to="/privacy">Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
