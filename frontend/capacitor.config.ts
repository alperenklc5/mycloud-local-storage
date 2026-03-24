import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alperen.mycloud',
  appName: 'My Cloud',
  webDir: 'out/renderer',
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
