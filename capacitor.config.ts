import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = { appId: process.env.OPENAURA_APP_ID ?? 'org.openaura.weather', appName: 'OpenAura', webDir: 'dist/native', server: { androidScheme: 'https' }, plugins: { Geolocation: { permissions: ['location'] } } };
export default config;
