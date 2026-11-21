import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
    server: { port: 3000 },
    define: {
      __OPEN_METEO_URL__: JSON.stringify(env.VITE_OPEN_METEO_URL || 'https://api.open-meteo.com'),
      __OPEN_METEO_GEOCODING_URL__: JSON.stringify(env.VITE_OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com'),
      'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify(env.NEXT_PUBLIC_SITE_URL || 'https://soklaro.com'),
      'process.env.NEXT_PUBLIC_REPOSITORY_URL': JSON.stringify(env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com/bvenne/soklaro'),
    },
    build: { outDir: 'dist/web' },
  };
});
