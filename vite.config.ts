/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://rafaelmortz213.github.io/morts-portfolio/
// The base path comes from ONE place. The router basename is derived from
// import.meta.env.BASE_URL (see src/lib/basePath.ts), so the build base and the
// router cannot disagree. Override with VITE_BASE_PATH (for example "/" if a
// custom domain is added later).
const DEFAULT_BASE_PATH = '/morts-portfolio/';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || DEFAULT_BASE_PATH;

  return {
    base,
    plugins: [react()],
    build: {
      sourcemap: false,
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
