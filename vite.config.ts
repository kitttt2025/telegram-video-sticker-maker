import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'production-content-security-policy',
      apply: 'build',
      transformIndexHtml() {
        return [{
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
          },
          injectTo: 'head-prepend',
        }];
      },
    },
  ],
  build: {
    target: 'es2022',
  },
});
