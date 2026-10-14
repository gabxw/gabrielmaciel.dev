// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gabrielmaciel.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
