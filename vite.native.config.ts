import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  root: 'native',
  base: './',
  publicDir: '../public',
  define: {
    __OPEN_METEO_URL__: JSON.stringify(process.env.VITE_OPEN_METEO_URL ?? 'https://api.open-meteo.com'),
    __OPEN_METEO_GEOCODING_URL__: JSON.stringify(process.env.VITE_OPEN_METEO_GEOCODING_URL ?? 'https://geocoding-api.open-meteo.com'),
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  // The React plugin injects an inline Fast Refresh preamble in dev. The app's
  // strict CSP blocks that preamble, so development uses Vite's TSX transform.
  plugins: command === 'build' ? [react()] : [],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: { outDir: '../dist/native', emptyOutDir: true },
}));
