import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bassclarity.app',
  appName: 'Bass Clarity',
  webDir: 'dist',

  // iOS-specific configuration
  ios: {
    // Use WKWebView with better performance
    contentInset: 'automatic',
    // Allow inline media playback
    allowsLinkPreview: true,
    // Handle safe areas properly
    scrollEnabled: true,
  },

  // Server configuration
  server: {
    // Allow external domains for API calls, Clerk auth, and maps
    allowNavigation: [
      'bassclarity.onrender.com',
      '*.mapbox.com',
      '*.clerk.accounts.dev',
      '*.clerk.com',
      'clerk.com',
      'api.clerk.com',
      'api.clerk.dev',
      '*.cloudflare.com',
    ],
  },

  // Plugin configurations
  plugins: {
    // Camera plugin configuration
    Camera: {
      // Use native photo picker on iOS 14+
      presentationStyle: 'fullscreen',
    },

    // Status bar configuration
    StatusBar: {
      style: 'light',
      backgroundColor: '#0a0a0a',
    },

    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#4A90E2',
    },
  },
};

export default config;
