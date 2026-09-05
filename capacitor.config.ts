import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = { appId: process.env.SOKLARO_APP_ID ?? 'org.soklaro.weather', appName: 'soklaro', webDir: 'dist/native', server: { androidScheme: 'https' }, plugins: { Geolocation: { permissions: ['location'] } } };
export default config;
