import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.orchidstechnology.uar',
  appName: 'uar-driver',
  webDir: 'www',
  server: {
    cleartext: true, // permite HTTP para desarrollo
  }
};

export default config;
