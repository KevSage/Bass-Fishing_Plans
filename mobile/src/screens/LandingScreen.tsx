import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Landing'>;

/**
 * Landing Screen
 * First screen users see - hero with sign in/up options
 */
export function LandingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={require('@/assets/hero_bass.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />
      </ImageBackground>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Logo/Title Area */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bass Clarity</Text>
          <Text style={styles.subtitle}>
            AI-Powered Fishing Intelligence
          </Text>
        </View>

        {/* Bottom CTA Area */}
        <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.tagline}>
            Get personalized fishing plans based on real-time conditions
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
