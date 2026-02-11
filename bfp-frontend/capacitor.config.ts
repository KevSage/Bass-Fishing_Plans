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
    // Allow loading from any origin (helps with Clerk auth)
    limitsNavigationsToAppBoundDomains: false,
  },

  // Server configuration
  server: {
    // Use bassclarity.com as hostname so Origin header matches Clerk's expected domain
    hostname: 'bassclarity.com',
    iosScheme: 'https',
    // Allow external domains for API calls, Clerk auth, and maps
    allowNavigation: [
      'bassclarity.onrender.com',
      '*.mapbox.com',
      // Clerk authentication domains
      'tolerant-skylark-94.clerk.accounts.dev',
      '*.clerk.accounts.dev',
      '*.clerk.com',
      'clerk.com',
      'api.clerk.com',
      'api.clerk.dev',
      'clerk.shared.lcl.dev',
      '*.clerkstage.dev',
      '*.lclclerk.com',
      // CDN and infrastructure
      '*.cloudflare.com',
      '*.cloudfront.net',
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
      resize: 'native',
      resizeOnFullScreen: true,
    },

    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 3000,  // Show splash for 3 seconds
      launchAutoHide: true,
      launchFadeOutDuration: 500,  // Fade out over 0.5 seconds
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      splashImmersive: true,
      splashFullScreen: true,
    },

    // Push notifications configuration
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
