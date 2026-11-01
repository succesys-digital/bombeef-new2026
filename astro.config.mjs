import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bombeefburgers.com.br',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
