import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { RootNavigator } from '@/navigation';
import { CLERK_PUBLISHABLE_KEY } from '@/constants/config';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';

/**
 * Secure token cache for Clerk
 * Uses expo-secure-store for encrypted storage on iOS
 */
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getToken error:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore saveToken error:', error);
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore clearToken error:', error);
    }
  },
};

/**
 * Loading fallback while Clerk initializes
 */
function ClerkLoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

/**
 * Error boundary for missing Clerk key
 */
function ClerkKeyMissing() {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Configuration Error</Text>
      <Text style={styles.errorText}>
        Missing Clerk publishable key. Please check your .env file.
      </Text>
    </View>
  );
}

export default function App() {
  // Debug: Log Clerk key status
  console.log('[App] Starting app...');
  console.log('[App] Clerk key present:', !!CLERK_PUBLISHABLE_KEY);
  console.log('[App] Clerk key length:', CLERK_PUBLISHABLE_KEY?.length);
  console.log('[App] Clerk key prefix:', CLERK_PUBLISHABLE_KEY?.substring(0, 30));
  console.log('[App] Raw env key:', process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 30));

  // Check for Clerk key
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <SafeAreaProvider>
        <ClerkKeyMissing />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <RootNavigator />
        </ClerkLoaded>
      </ClerkProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
