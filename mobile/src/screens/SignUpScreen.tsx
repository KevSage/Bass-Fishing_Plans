import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors } from '@/constants/colors';
import { APP_CONFIG } from '@/constants/config';
import { BackButton } from '@/components/BackButton';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

/**
 * Sign Up Screen
 * Two-stage flow: Create account -> Verify email
 */
export function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClerkWarning, setShowClerkWarning] = useState(false);

  // Show warning if Clerk takes too long to load
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setShowClerkWarning(true);
      }, APP_CONFIG.clerkLoadingTimeout);
      return () => clearTimeout(timer);
    } else {
      setShowClerkWarning(false);
    }
  }, [isLoaded]);

  // Handle account creation
  const handleSubmit = async () => {
    // Validation
    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < APP_CONFIG.minPasswordLength) {
      setError(`Password must be at least ${APP_CONFIG.minPasswordLength} characters`);
      return;
    }

    if (!isLoaded || !signUp) {
      setError('Authentication is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Show verification form
      setVerifying(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        err.message ||
        'Failed to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification
  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!isLoaded || !signUp) {
      setError('Please wait a moment and try again');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Navigation will happen automatically via RootNavigator
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        err.message ||
        'Invalid verification code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle back from verification
  const handleBackToSignUp = () => {
    setVerifying(false);
    setCode('');
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <ImageBackground
        source={require('@/assets/hero_bass.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />
      </ImageBackground>

      {/* Back Button - Safe Area Aware */}
      <View style={[styles.backButtonContainer, { top: insets.top + 12 }]}>
        <BackButton
          onPress={verifying ? handleBackToSignUp : () => navigation.goBack()}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>
            {verifying ? 'Verify Email' : 'Create Account'}
          </Text>

          {/* Form Card */}
          <View style={styles.formCard}>
            {!verifying ? (
              // Sign Up Form
              <>
                {/* Clerk Loading Warning */}
                {showClerkWarning && !isLoaded && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      Authentication is taking longer than usual...
                    </Text>
                  </View>
                )}

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry
                    autoComplete="new-password"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <Text style={styles.hint}>Must be at least 8 characters</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.text.primary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                {/* Footer Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Verification Form
              <>
                <Text style={styles.verificationInfo}>
                  We sent a verification code to{' '}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Verification Code Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="one-time-code"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleVerify}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.text.primary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Verify Email</Text>
                  )}
                </TouchableOpacity>

                {/* Back to Sign Up */}
                <TouchableOpacity
                  style={styles.backLink}
                  onPress={handleBackToSignUp}
                  disabled={loading}
                >
                  <Text style={styles.backLinkText}>← Back to sign up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  formCard: {
    backgroundColor: 'rgba(20, 20, 25, 0.9)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  warningBox: {
    backgroundColor: colors.warningBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.errorBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
  },
  hint: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  verificationInfo: {
    color: colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
