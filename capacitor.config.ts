import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b679a0e4f33649c38284f5ec6fc30dbb',
  appName: 'legion-vault-nexus',
  webDir: 'dist',
  server: {
    url: 'https://b679a0e4-f336-49c3-8284-f5ec6fc30dbb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false
    }
  }
};

export default config;
